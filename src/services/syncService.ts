import { db, doc, setDoc, onSnapshot, CLOUD_SYNC_DOC_ID } from './firebase';
import { storage } from './storage';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

class FirebaseSyncService {
  private syncStatus: SyncStatus = 'offline';
  private lastSyncTime: string | null = null;
  private listeners: ((status: SyncStatus, lastSync: string | null) => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private isUpdatingFromRemote = false;
  private debounceTimer: any = null;

  public init() {
    this.setStatus('syncing');

    // Subscribe to changes in Firestore
    try {
      const docRef = doc(db, 'edunova_data', CLOUD_SYNC_DOC_ID);
      this.unsubscribeFirestore = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && !this.isUpdatingFromRemote) {
              this.applyRemoteData(data);
            }
          } else {
            // First time: upload local data to Firestore
            this.pushLocalToFirestore(true);
          }
          this.setStatus('synced');
          this.lastSyncTime = new Date().toLocaleTimeString('fr-FR');
          this.notifyListeners();
        },
        (error) => {
          console.warn('Firebase sync listener warning:', error);
          this.setStatus('offline');
          this.notifyListeners();
        }
      );
    } catch (e) {
      console.warn('Failed to start Firebase sync listener:', e);
      this.setStatus('offline');
    }

    // Intercept local storage updates to debounce upload to cloud
    window.addEventListener('storage', () => {
      this.triggerDebouncedSync();
    });
  }

  public getStatus(): { status: SyncStatus; lastSyncTime: string | null } {
    return {
      status: this.syncStatus,
      lastSyncTime: this.lastSyncTime,
    };
  }

  public onStatusChange(callback: (status: SyncStatus, lastSync: string | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.syncStatus, this.lastSyncTime);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public triggerDebouncedSync() {
    if (this.isUpdatingFromRemote) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.setStatus('syncing');
    this.debounceTimer = setTimeout(() => {
      this.pushLocalToFirestore();
    }, 1500);
  }

  public async pushLocalToFirestore(isInitial = false) {
    try {
      this.setStatus('syncing');
      const payload = {
        updated_at: new Date().toISOString(),
        schools: storage.getAllSchools(),
        users: storage.getAllUsers(),
        students: storage.getStudents(),
        classes: storage.getClasses(),
        payments: storage.getPayments(),
        attendances: storage.getAttendances(),
        assessments: storage.getAssessments(),
        kindergarten_reports: storage.getKindergartenReports(),
        kindergarten_logs: storage.getKindergartenDailyLogs(),
      };

      const docRef = doc(db, 'edunova_data', CLOUD_SYNC_DOC_ID);
      await setDoc(docRef, payload, { merge: true });
      this.setStatus('synced');
      this.lastSyncTime = new Date().toLocaleTimeString('fr-FR');
      this.notifyListeners();
    } catch (err) {
      console.warn('Firebase push failed:', err);
      this.setStatus('error');
      this.notifyListeners();
    }
  }

  private applyRemoteData(data: any) {
    try {
      this.isUpdatingFromRemote = true;
      if (Array.isArray(data.schools) && data.schools.length > 0) {
        localStorage.setItem('edunova_all_schools', JSON.stringify(data.schools));
      }
      if (Array.isArray(data.users) && data.users.length > 0) {
        localStorage.setItem('edunova_all_users', JSON.stringify(data.users));
      }
      if (Array.isArray(data.students)) {
        localStorage.setItem('edunova_students', JSON.stringify(data.students));
      }
      if (Array.isArray(data.classes)) {
        localStorage.setItem('edunova_classes', JSON.stringify(data.classes));
      }
      if (Array.isArray(data.payments)) {
        localStorage.setItem('edunova_payments', JSON.stringify(data.payments));
      }
      if (Array.isArray(data.attendances)) {
        localStorage.setItem('edunova_attendances', JSON.stringify(data.attendances));
      }
      if (Array.isArray(data.assessments)) {
        localStorage.setItem('edunova_assessments', JSON.stringify(data.assessments));
      }
      if (Array.isArray(data.kindergarten_reports)) {
        localStorage.setItem('edunova_kindergarten_reports', JSON.stringify(data.kindergarten_reports));
      }
      if (Array.isArray(data.kindergarten_logs)) {
        localStorage.setItem('edunova_kindergarten_logs', JSON.stringify(data.kindergarten_logs));
      }

      // Dispatch custom event to let React components refresh
      window.dispatchEvent(new Event('edunova_cloud_synced'));
    } catch (err) {
      console.error('Error applying remote data:', err);
    } finally {
      setTimeout(() => {
        this.isUpdatingFromRemote = false;
      }, 500);
    }
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
