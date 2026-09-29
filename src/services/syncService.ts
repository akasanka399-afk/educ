import {
  db,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  CLOUD_SYNC_DOC_ID,
  CLOUD_COLLECTION_NAME,
  SyncStatus,
} from './firebase';
import { storage, STORAGE_KEYS } from './storage';

export type { SyncStatus };

// Map entre les clés de stockage locales et les noms de documents Firestore
const KEY_TO_DOC_MAP: Record<string, string> = {
  [STORAGE_KEYS.STUDENTS]: 'students',
  [STORAGE_KEYS.PAYMENTS]: 'payments',
  [STORAGE_KEYS.CLASSES]: 'classes',
  [STORAGE_KEYS.ALL_SCHOOLS]: 'schools',
  [STORAGE_KEYS.ALL_USERS]: 'users',
  [STORAGE_KEYS.ATTENDANCES]: 'attendances',
  [STORAGE_KEYS.ASSESSMENTS]: 'assessments',
  [STORAGE_KEYS.KINDERGARTEN_REPORTS]: 'kindergarten_reports',
  [STORAGE_KEYS.KINDERGARTEN_LOGS]: 'kindergarten_logs',
  [STORAGE_KEYS.AUDIT_LOGS]: 'audit_logs',
};

const DOC_TO_KEY_MAP: Record<string, string> = Object.entries(KEY_TO_DOC_MAP).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k }),
  {}
);

class FirebaseSyncService {
  private syncStatus: SyncStatus = 'offline';
  private lastSyncTime: string | null = null;
  private listeners: ((status: SyncStatus, lastSync: string | null) => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private isUpdatingFromRemote = false;
  private debounceTimers: Map<string, any> = new Map();
  private deviceId: string = '';
  private reconnectTimeout: any = null;
  private hasInitialized = false;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'server_instance';
    let id = localStorage.getItem('edunova_device_id');
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('edunova_device_id', id);
    }
    return id;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public init() {
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    this.setStatus('connecting');

    // Écouter les changements réseau du navigateur
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Réseau rétabli, reconnexion Firebase...');
        this.startRealtimeListener();
        this.pullRemoteFromFirestore();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });

      // Écouter les mutations locales de storage.ts
      storage.onDataChange((key: string) => {
        if (!this.isUpdatingFromRemote) {
          this.queueSyncForKey(key);
        }
      });
    }

    // Démarrer l'écoute en temps réel Firestore
    this.startRealtimeListener();

    // Effectuer une première vérification et hydratation depuis Firestore
    this.initialBootstrap();
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      console.log('Tentative de reconnexion au flux Firestore...');
      this.startRealtimeListener();
    }, 5000);
  }

  /**
   * Écoute en temps réel de tous les documents de la collection edunova_data
   */
  private startRealtimeListener() {
    if (this.unsubscribeFirestore) {
      try {
        this.unsubscribeFirestore();
      } catch {
        // Ignorer
      }
      this.unsubscribeFirestore = null;
    }

    try {
      const colRef = collection(db, CLOUD_COLLECTION_NAME);
      this.unsubscribeFirestore = onSnapshot(
        colRef,
        { includeMetadataChanges: false },
        (snapshot) => {
          let hasChanges = false;

          snapshot.docChanges().forEach((change) => {
            const docId = change.doc.id;
            const data = change.doc.data();
            if (!data) return;

            // Ignorer si la mise à jour vient de cet appareil pour éviter les boucles
            if (data.updated_by_device === this.deviceId) {
              return;
            }

            const updated = this.applyRemoteDoc(docId, data);
            if (updated) {
              hasChanges = true;
            }
          });

          this.setStatus('synced');
          this.lastSyncTime = new Date().toLocaleTimeString('fr-FR');
          this.notifyListeners();

          if (hasChanges) {
            // Notifier l'application pour re-rendre les écrans en temps réel
            window.dispatchEvent(
              new CustomEvent('edunova_cloud_synced', {
                detail: { time: this.lastSyncTime, fromRemote: true },
              })
            );
            window.dispatchEvent(
              new CustomEvent('edunova_data_updated', {
                detail: { remote: true },
              })
            );
          }
        },
        (error) => {
          console.warn('Erreur écoute temps réel Firestore:', error);
          this.setStatus('error');
          this.scheduleReconnect();
        }
      );
    } catch (err) {
      console.error('Erreur démarrage écouteur Firestore:', err);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Applique les données d'un document distant reçu en temps réel
   */
  private applyRemoteDoc(docId: string, data: any): boolean {
    const localKey = DOC_TO_KEY_MAP[docId];
    if (!localKey && docId !== CLOUD_SYNC_DOC_ID) return false;

    this.isUpdatingFromRemote = true;
    try {
      if (docId === CLOUD_SYNC_DOC_ID) {
        // Master document fallback
        return this.hydrateFromMaster(data);
      }

      if (Array.isArray(data.list)) {
        const currentRaw = localStorage.getItem(localKey);
        const newRaw = JSON.stringify(data.list);

        // Si identique, pas besoin de réécrire
        if (currentRaw === newRaw) {
          return false;
        }

        localStorage.setItem(localKey, newRaw);

        // Si ce sont les écoles, mettre à jour la configuration active
        if (localKey === STORAGE_KEYS.ALL_SCHOOLS) {
          const activeCode = storage.getActiveSchoolCode();
          if (activeCode) {
            const found = data.list.find(
              (s: any) => s.access_code?.toUpperCase() === activeCode.toUpperCase()
            );
            if (found) {
              localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(found));
            }
          }
        }

        return true;
      }
      return false;
    } catch (e) {
      console.error(`Erreur application remote doc ${docId}:`, e);
      return false;
    } finally {
      setTimeout(() => {
        this.isUpdatingFromRemote = false;
      }, 100);
    }
  }

  /**
   * Synchronisation initiale lors de l'ouverture de l'application
   */
  private async initialBootstrap() {
    try {
      this.setStatus('syncing');

      // Vérifier si des documents granulaires existent déjà dans Firestore
      const colRef = collection(db, CLOUD_COLLECTION_NAME);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        // Firestore est totalement vide : pousser les données locales initiales
        console.log('Firestore vide : initialisation avec données locales...');
        await this.pushLocalToFirestore(true);
      } else {
        // Des données existent : hydrater les documents manquants ou plus récents
        let foundGranular = false;
        let masterDocData: any = null;

        snapshot.docs.forEach((d) => {
          if (d.id === CLOUD_SYNC_DOC_ID) {
            masterDocData = d.data();
          } else if (DOC_TO_KEY_MAP[d.id]) {
            foundGranular = true;
            this.applyRemoteDoc(d.id, d.data());
          }
        });

        // Si seul le document maître existait, le ventiler vers les documents granulaires
        if (!foundGranular && masterDocData) {
          console.log('Migration du document maître vers les documents granulaires...');
          this.hydrateFromMaster(masterDocData);
          await this.pushLocalToFirestore(false);
        }
      }

      this.setStatus('synced');
      this.lastSyncTime = new Date().toLocaleTimeString('fr-FR');
      this.notifyListeners();

      // Notifier immédiatement les composants React dès la fin de l'hydratation Firestore
      window.dispatchEvent(
        new CustomEvent('edunova_cloud_synced', {
          detail: { time: this.lastSyncTime, bootstrap: true },
        })
      );
      window.dispatchEvent(
        new CustomEvent('edunova_data_updated', {
          detail: { remote: true, bootstrap: true },
        })
      );
    } catch (err) {
      console.warn('Erreur initial bootstrap Firestore:', err);
      this.setStatus('error');
    }
  }

  private hydrateFromMaster(data: any): boolean {
    if (!data) return false;
    let modified = false;

    const mappings: [string, any][] = [
      [STORAGE_KEYS.ALL_SCHOOLS, data.schools],
      [STORAGE_KEYS.ALL_USERS, data.users],
      [STORAGE_KEYS.STUDENTS, data.students],
      [STORAGE_KEYS.CLASSES, data.classes],
      [STORAGE_KEYS.PAYMENTS, data.payments],
      [STORAGE_KEYS.ATTENDANCES, data.attendances],
      [STORAGE_KEYS.ASSESSMENTS, data.assessments],
      [STORAGE_KEYS.KINDERGARTEN_REPORTS, data.kindergarten_reports],
      [STORAGE_KEYS.KINDERGARTEN_LOGS, data.kindergarten_logs],
    ];

    mappings.forEach(([key, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        const cur = localStorage.getItem(key);
        const next = JSON.stringify(list);
        if (cur !== next) {
          localStorage.setItem(key, next);
          modified = true;
        }
      }
    });

    return modified;
  }

  /**
   * Met en file d'attente l'envoi d'une clé spécifique vers Firestore
   */
  public queueSyncForKey(storageKey: string) {
    if (this.isUpdatingFromRemote) return;

    // Si changement d'école active, synchroniser les écoles
    const targetKey =
      storageKey === STORAGE_KEYS.SCHOOL_CONFIG || storageKey === STORAGE_KEYS.ACTIVE_SCHOOL_CODE
        ? STORAGE_KEYS.ALL_SCHOOLS
        : storageKey;

    const docId = KEY_TO_DOC_MAP[targetKey];
    if (!docId) return;

    // Les paiements et élèves sont prioritaires : envoi immédiat sans délai pour éviter toute perte
    if (docId === 'payments' || docId === 'students') {
      const existing = this.debounceTimers.get(docId);
      if (existing) clearTimeout(existing);
      this.debounceTimers.delete(docId);
      this.pushDocToFirestore(docId, targetKey);
      return;
    }

    const existingTimer = this.debounceTimers.get(docId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    this.setStatus('syncing');

    const timer = setTimeout(() => {
      this.debounceTimers.delete(docId);
      this.pushDocToFirestore(docId, targetKey);
    }, 250);

    this.debounceTimers.set(docId, timer);
  }

  /**
   * Pousse un document granulaire vers Firestore
   */
  private async pushDocToFirestore(docId: string, storageKey: string) {
    try {
      const raw = localStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];

      const payload = {
        list,
        updated_at: new Date().toISOString(),
        updated_by_device: this.deviceId,
        updated_by_user: storage.getCurrentUser()?.name || 'Utilisateur',
      };

      const docRef = doc(db, CLOUD_COLLECTION_NAME, docId);
      await setDoc(docRef, payload, { merge: true });

      // Si paiement mis à jour, s'assurer que les élèves (soldes financiers) sont aussi synchronisés
      if (docId === 'payments') {
        const studentsRaw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (studentsRaw) {
          const stDocRef = doc(db, CLOUD_COLLECTION_NAME, 'students');
          await setDoc(
            stDocRef,
            {
              list: JSON.parse(studentsRaw),
              updated_at: new Date().toISOString(),
              updated_by_device: this.deviceId,
              updated_by_user: storage.getCurrentUser()?.name || 'Caisse',
            },
            { merge: true }
          );
        }
      }

      this.setStatus('synced');
      this.lastSyncTime = new Date().toLocaleTimeString('fr-FR');
      this.notifyListeners();
    } catch (err) {
      console.warn(`Échec de l'envoi Firestore pour ${docId}:`, err);
      this.setStatus('error');
    }
  }

  /**
   * Pousse l'intégralité des collections vers Firestore (sauvegarde complète & documents granulaires)
   */
  public async pushLocalToFirestore(isInitial = false): Promise<boolean> {
    try {
      this.setStatus('syncing');
      const now = new Date().toISOString();

      const collections = [
        { docId: 'schools', key: STORAGE_KEYS.ALL_SCHOOLS, data: storage.getAllSchools() },
        { docId: 'users', key: STORAGE_KEYS.ALL_USERS, data: storage.getAllUsers() },
        { docId: 'classes', key: STORAGE_KEYS.CLASSES, data: storage.getClasses() },
        { docId: 'students', key: STORAGE_KEYS.STUDENTS, data: storage.getStudents() },
        { docId: 'payments', key: STORAGE_KEYS.PAYMENTS, data: storage.getPayments() },
        { docId: 'attendances', key: STORAGE_KEYS.ATTENDANCES, data: storage.getAttendances() },
        { docId: 'assessments', key: STORAGE_KEYS.ASSESSMENTS, data: storage.getAssessments() },
        {
          docId: 'kindergarten_reports',
          key: STORAGE_KEYS.KINDERGARTEN_REPORTS,
          data: storage.getKindergartenReports(),
        },
        {
          docId: 'kindergarten_logs',
          key: STORAGE_KEYS.KINDERGARTEN_LOGS,
          data: storage.getKindergartenDailyLogs(),
        },
        { docId: 'audit_logs', key: STORAGE_KEYS.AUDIT_LOGS, data: storage.getAuditLogs() },
      ];

      // Écriture en parallèle des documents granulaires
      const writePromises = collections.map((col) => {
        const docRef = doc(db, CLOUD_COLLECTION_NAME, col.docId);
        return setDoc(
          docRef,
          {
            list: col.data,
            updated_at: now,
            updated_by_device: this.deviceId,
            updated_by_user: storage.getCurrentUser()?.name || 'Admin',
          },
          { merge: true }
        );
      });

      // Également mettre à jour le document maître consolidé pour sécurité et historique
      const masterPayload = {
        updated_at: now,
        updated_by_device: this.deviceId,
        schools: storage.getAllSchools(),
        users: storage.getAllUsers(),
        students: storage.getStudents(),
        classes: storage.getClasses(),
        payments: storage.getPayments(),
        attendances: storage.getAttendances(),
        assessments: storage.getAssessments(),
        kindergarten_reports: storage.getKindergartenReports(),
        kindergarten_logs: storage.getKindergartenDailyLogs(),
        audit_logs: storage.getAuditLogs(),
      };
      const masterRef = doc(db, CLOUD_COLLECTION_NAME, CLOUD_SYNC_DOC_ID);
      writePromises.push(setDoc(masterRef, masterPayload, { merge: true }));

      await Promise.all(writePromises);

      this.setStatus('synced');
      this.lastSyncTime = new Date().toLocaleTimeString('fr-FR');
      this.notifyListeners();
      return true;
    } catch (err) {
      console.warn('Échec envoi global Firestore:', err);
      this.setStatus('error');
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Force la récupération de toutes les collections depuis Firestore
   */
  public async pullRemoteFromFirestore(): Promise<boolean> {
    try {
      this.setStatus('syncing');
      const colRef = collection(db, CLOUD_COLLECTION_NAME);
      const snapshot = await getDocs(colRef);

      let updatedAny = false;
      snapshot.docs.forEach((docSnap) => {
        if (this.applyRemoteDoc(docSnap.id, docSnap.data())) {
          updatedAny = true;
        }
      });

      this.setStatus('synced');
      this.lastSyncTime = new Date().toLocaleTimeString('fr-FR');
      this.notifyListeners();

      if (updatedAny) {
        window.dispatchEvent(
          new CustomEvent('edunova_cloud_synced', { detail: { time: this.lastSyncTime } })
        );
        window.dispatchEvent(new CustomEvent('edunova_data_updated', { detail: { remote: true } }));
      }
      return true;
    } catch (e) {
      console.error('Erreur récupération distante:', e);
      this.setStatus('error');
      return false;
    }
  }

  public getStatus(): { status: SyncStatus; lastSyncTime: string | null; deviceId: string } {
    return {
      status: this.syncStatus,
      lastSyncTime: this.lastSyncTime,
      deviceId: this.deviceId,
    };
  }

  public onStatusChange(
    callback: (status: SyncStatus, lastSync: string | null) => void
  ): () => void {
    this.listeners.push(callback);
    callback(this.syncStatus, this.lastSyncTime);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.syncStatus, this.lastSyncTime));
  }
}

export const syncService = new FirebaseSyncService();
