import {
  Student,
  SchoolClass,
  Payment,
  AttendanceRecord,
  Assessment,
  ReportCard,
  KindergartenReport,
  KindergartenDailyLog,
  SchoolConfig,
  UserProfile,
  AuditLog,
  WhatsAppMessageLog,
} from '../types';

const STORAGE_KEYS = {
  ALL_SCHOOLS: 'edunova_all_schools',
  ALL_USERS: 'edunova_all_users',
  ACTIVE_SCHOOL_CODE: 'edunova_active_school_code',
  SCHOOL_CONFIG: 'edunova_school_config',
  CLASSES: 'edunova_classes',
  STUDENTS: 'edunova_students',
  PAYMENTS: 'edunova_payments',
  ATTENDANCES: 'edunova_attendances',
  ASSESSMENTS: 'edunova_assessments',
  KINDERGARTEN_REPORTS: 'edunova_kindergarten_reports',
  KINDERGARTEN_LOGS: 'edunova_kindergarten_logs',
  AUDIT_LOGS: 'edunova_audit_logs',
  WHATSAPP_LOGS: 'edunova_whatsapp_logs',
  CURRENT_USER: 'edunova_current_user',
};

export const SUPER_ADMIN_PIN = '761278';

export const DEFAULT_SCHOOLS: SchoolConfig[] = [
  {
    id: 'sch_wend_panga',
    access_code: 'WENDPANGA',
    name: 'Groupe Scolaire Wend-Panga',
    short_code: 'GSWP',
    motto: 'Foi - Travail - Excellence',
    region: 'Centre / Kadiogo / Ouagadougou',
    address: 'Secteur 28, Arrondissement 6, Quartier Cissin',
    phone: '+226 25 36 40 12',
    whatsapp: '+226 70 20 30 40',
    email: 'direction@wendpanga.bf',
    academic_year: '2025-2026',
    active_modules: {
      kindergarten: true,
      primary: true,
    },
    cash_prefix: 'CAISSE-1',
    receipt_counter: 104,
    stamp_text: 'Direction Générale - GS Wend-Panga Ouagadougou',
    subscription: {
      status: 'active',
      plan: 'annual',
      start_date: '2025-09-01',
      expires_at: '2026-08-31',
      price_fcfa: 200000,
      last_payment_date: '2025-09-01',
      notes: 'Abonnement Annuel 2025-2026 payé par Orange Money',
    },
    created_at: '2025-08-15T10:00:00Z',
  },
  {
    id: 'sch_merveilles',
    access_code: 'MERVEILLES',
    name: 'Complexe Scolaire Les Merveilles',
    short_code: 'CSLM',
    motto: 'Discipline - Savoir - Réussite',
    region: 'Hauts-Bassins / Bobo-Dioulasso',
    address: 'Secteur 15, Quartier Ouezzin-Ville',
    phone: '+226 20 98 12 34',
    whatsapp: '+226 76 50 60 70',
    email: 'contact@lesmerveilles-bobo.bf',
    academic_year: '2025-2026',
    active_modules: {
      kindergarten: true,
      primary: true,
    },
    cash_prefix: 'CAISSE-M',
    receipt_counter: 45,
    stamp_text: 'Direction Pédagogique - CS Les Merveilles Bobo',
    subscription: {
      status: 'trial',
      plan: 'monthly',
      start_date: '2026-09-15',
      expires_at: '2026-10-15',
      price_fcfa: 25000,
      notes: 'Période d\'essai gratuit de 30 jours',
    },
    created_at: '2026-09-15T08:30:00Z',
  },
  {
    id: 'sch_espoir',
    access_code: 'ESPOIR',
    name: 'École Nouvelle L’Espoir',
    short_code: 'ENE',
    motto: 'Éducation pour tous et excellence',
    region: 'Plateau-Central / Ziniaré',
    address: 'Secteur 3, Route de Kaya',
    phone: '+226 25 30 11 22',
    whatsapp: '+226 78 12 34 56',
    email: 'info@ecolenouvelle-espoir.bf',
    academic_year: '2025-2026',
    active_modules: {
      kindergarten: false,
      primary: true,
    },
    cash_prefix: 'CAISSE-E',
    receipt_counter: 12,
    stamp_text: 'Fondation L’Espoir - Ziniaré',
    subscription: {
      status: 'expired',
      plan: 'monthly',
      start_date: '2026-07-01',
      expires_at: '2026-08-31',
      price_fcfa: 25000,
      notes: 'Abonnement expiré. En attente de régularisation.',
    },
    created_at: '2026-07-01T09:00:00Z',
  },
];

const DEFAULT_SCHOOL = DEFAULT_SCHOOLS[0];

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr_adm_wendpanga',
    name: 'M. SAWADOGO Aristide (Admin Établissement)',
    email: 'admin@wendpanga.bf',
    phone: '+226 70 25 30 35',
    role: 'school_admin',
    school_id: 'sch_wend_panga',
    pin: '5544',
    is_active: true,
  },
  {
    id: 'usr_dir',
    name: 'M. OUÉDRAOGO François',
    email: 'direction@wendpanga.bf',
    phone: '+226 70 11 22 33',
    role: 'director',
    school_id: 'sch_wend_panga',
    pin: '1234',
    is_active: true,
  },
  {
    id: 'usr_cpt',
    name: 'Mme COMPAORÉ Aminata',
    email: 'compta@wendpanga.bf',
    phone: '+226 76 44 55 66',
    role: 'accountant',
    school_id: 'sch_wend_panga',
    pin: '2468',
    is_active: true,
  },
  {
    id: 'usr_sec',
    name: 'Mme TRAORÉ Mariam',
    email: 'secretariat@wendpanga.bf',
    phone: '+226 65 77 88 99',
    role: 'secretary',
    school_id: 'sch_wend_panga',
    pin: '1357',
    is_active: true,
  },
  {
    id: 'usr_ens_cm2',
    name: 'M. ZONGO Pascal',
    email: 'zongo.cm2@wendpanga.bf',
    phone: '+226 78 99 00 11',
    role: 'teacher',
    school_id: 'sch_wend_panga',
    assigned_class_ids: ['cls_cm2'],
    pin: '1111',
    is_active: true,
  },
  {
    id: 'usr_edu_ps',
    name: 'Mme SAWADOGO Fatimata',
    email: 'sawadogo.mat@wendpanga.bf',
    phone: '+226 70 88 44 22',
    role: 'teacher',
    school_id: 'sch_wend_panga',
    assigned_class_ids: ['cls_ps', 'cls_ms'],
    pin: '2222',
    is_active: true,
  },
  {
    id: 'usr_fnd',
    name: 'M. KABORÉ Jean-Baptiste',
    email: 'promoteur@wendpanga.bf',
    phone: '+226 70 00 11 22',
    role: 'founder',
    school_id: 'sch_wend_panga',
    pin: '9999',
    is_active: true,
  },
  // Utilisateurs pour Complexe Scolaire Les Merveilles
  {
    id: 'usr_adm_merveilles',
    name: 'Mme SANON Brigitte (Admin Établissement)',
    email: 'admin@lesmerveilles-bobo.bf',
    phone: '+226 76 10 20 30',
    role: 'school_admin',
    school_id: 'sch_merveilles',
    pin: '5544',
    is_active: true,
  },
  {
    id: 'usr_dir_merveilles',
    name: 'M. BADO Idrissa',
    email: 'direction@lesmerveilles-bobo.bf',
    phone: '+226 76 50 60 70',
    role: 'director',
    school_id: 'sch_merveilles',
    pin: '1234',
    is_active: true,
  },
  {
    id: 'usr_cpt_merveilles',
    name: 'Mme OUATTARA Salimata',
    email: 'compta@lesmerveilles-bobo.bf',
    phone: '+226 70 99 88 77',
    role: 'accountant',
    school_id: 'sch_merveilles',
    pin: '1234',
    is_active: true,
  },
  // Utilisateur pour École Nouvelle L'Espoir
  {
    id: 'usr_adm_espoir',
    name: 'M. KINDA Mahamadi (Admin Établissement)',
    email: 'admin@ecolenouvelle-espoir.bf',
    phone: '+226 78 88 77 66',
    role: 'school_admin',
    school_id: 'sch_espoir',
    pin: '5544',
    is_active: true,
  },
  {
    id: 'usr_dir_espoir',
    name: 'M. ILBOUDO Patrice',
    email: 'direction@ecolenouvelle-espoir.bf',
    phone: '+226 78 12 34 56',
    role: 'director',
    school_id: 'sch_espoir',
    pin: '1234',
    is_active: true,
  }
];

const DEFAULT_CLASSES: SchoolClass[] = [
  {
    id: 'cls_ps',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    cycle: 'kindergarten',
    level: 'PS',
    name: 'Petite Section (Les Poussins)',
    capacity: 25,
    subjects: [],
  },
  {
    id: 'cls_ms',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    cycle: 'kindergarten',
    level: 'MS',
    name: 'Moyenne Section (Les Gazelles)',
    capacity: 30,
    subjects: [],
  },
  {
    id: 'cls_gs',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    cycle: 'kindergarten',
    level: 'GS',
    name: 'Grande Section (Les Lions)',
    capacity: 30,
    subjects: [],
  },
  {
    id: 'cls_cp1',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    cycle: 'primary',
    level: 'CP1',
    name: 'CP1 A',
    capacity: 45,
    subjects: [
      { id: 'sub_langage', name: 'Langage / Vocabulaire', code: 'LANG', coefficient: 2, max_score: 10, category: 'fondamentale' },
      { id: 'sub_lecture', name: 'Lecture & Décodage', code: 'LECT', coefficient: 3, max_score: 10, category: 'fondamentale' },
      { id: 'sub_ecriture', name: 'Écriture / Graphisme', code: 'ECR', coefficient: 2, max_score: 10, category: 'fondamentale' },
      { id: 'sub_calcul', name: 'Calcul / Opérations', code: 'CALC', coefficient: 3, max_score: 10, category: 'fondamentale' },
      { id: 'sub_dessin', name: 'Dessin & Travail Manuel', code: 'ART', coefficient: 1, max_score: 10, category: 'eveil' },
    ],
  },
  {
    id: 'cls_ce2',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    cycle: 'primary',
    level: 'CE2',
    name: 'CE2 B',
    capacity: 40,
    subjects: [
      { id: 'sub_dictee', name: 'Dictée & Questions', code: 'DICT', coefficient: 2, max_score: 10, category: 'fondamentale' },
      { id: 'sub_expression', name: 'Expression Écrite', code: 'EXP', coefficient: 2, max_score: 10, category: 'fondamentale' },
      { id: 'sub_calcul_ce2', name: 'Opérations & Problèmes', code: 'CALC', coefficient: 3, max_score: 10, category: 'fondamentale' },
      { id: 'sub_histoire_geo', name: 'Histoire & Géographie du Burkina', code: 'HG', coefficient: 1, max_score: 10, category: 'eveil' },
      { id: 'sub_sciences', name: 'Sciences d\'Observation', code: 'SO', coefficient: 1, max_score: 10, category: 'eveil' },
      { id: 'sub_sport', name: 'Éducation Physique (EPS)', code: 'EPS', coefficient: 1, max_score: 10, category: 'sport' },
    ],
  },
  {
    id: 'cls_cm2',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    cycle: 'primary',
    level: 'CM2',
    name: 'CM2 Promotion CEP',
    capacity: 45,
    subjects: [
      { id: 'sub_dictee_cm2', name: 'Dictée - Orthographe', code: 'DICT', coefficient: 2, max_score: 10, category: 'fondamentale' },
      { id: 'sub_etude_texte', name: 'Étude de Texte & Vocabulaire', code: 'ET', coefficient: 2, max_score: 10, category: 'fondamentale' },
      { id: 'sub_redaction', name: 'Rédaction', code: 'RED', coefficient: 2, max_score: 10, category: 'fondamentale' },
      { id: 'sub_operations', name: 'Opérations', code: 'OP', coefficient: 3, max_score: 10, category: 'fondamentale' },
      { id: 'sub_problemes', name: 'Problèmes Mathématiques', code: 'PROB', coefficient: 3, max_score: 10, category: 'fondamentale' },
      { id: 'sub_histoire_burkina', name: 'Histoire & Géographie', code: 'HG', coefficient: 1, max_score: 10, category: 'eveil' },
      { id: 'sub_sciences_cm2', name: 'Sciences d\'Observation', code: 'SO', coefficient: 1, max_score: 10, category: 'eveil' },
      { id: 'sub_dessin_cm2', name: 'Dessin', code: 'DES', coefficient: 1, max_score: 10, category: 'eveil' },
      { id: 'sub_eps_cm2', name: 'Éducation Civique & Morale', code: 'ECM', coefficient: 1, max_score: 10, category: 'eveil' },
    ],
  },
];

const DEFAULT_STUDENTS: Student[] = [
  // Maternelle
  {
    id: 'std_mat_1',
    school_id: 'sch_wend_panga',
    student_number: 'GSWP-25-0012',
    first_name: 'Wend-Kuni Inès',
    last_name: 'OUÉDRAOGO',
    birth_date: '2022-04-14',
    birth_place: 'Ouagadougou',
    gender: 'F',
    class_id: 'cls_ps',
    cycle: 'kindergarten',
    academic_year_id: '2025-2026',
    parent_name: 'M. OUÉDRAOGO Salif',
    parent_relation: 'father',
    parent_phone: '+226 70 23 45 67',
    parent_profession: 'Commerçant à Rood-Woko',
    parent_address: 'Cissin, Rue 16.42',
    health_notes: 'Allergie sévère aux arachides',
    allergies: 'Arachides',
    authorized_pickups: [
      { id: 'pk_1', name: 'Mme OUÉDRAOGO Awa', relation: 'Mère', phone: '+226 76 12 34 56' },
      { id: 'pk_2', name: 'M. SAWADOGO Moussa', relation: 'Chauffeur familial', phone: '+226 65 99 88 77', cni: 'B1245789' },
    ],
    total_fees: 160000,
    discount: 0,
    paid_amount: 110000,
    created_at: '2025-09-02T08:30:00Z',
  },
  {
    id: 'std_mat_2',
    school_id: 'sch_wend_panga',
    student_number: 'GSWP-25-0015',
    first_name: 'Yannick Pegdwendé',
    last_name: 'KABORÉ',
    birth_date: '2021-11-20',
    birth_place: 'Koudougou',
    gender: 'M',
    class_id: 'cls_ms',
    cycle: 'kindergarten',
    academic_year_id: '2025-2026',
    parent_name: 'Mme KABORÉ Sylvie',
    parent_relation: 'mother',
    parent_phone: '+226 71 88 99 00',
    parent_profession: 'Sage-femme',
    parent_address: 'Gounghin Sud',
    health_notes: 'Asthme léger lors de poussière',
    authorized_pickups: [
      { id: 'pk_3', name: 'M. KABORÉ Eric', relation: 'Père', phone: '+226 78 55 44 33' },
      { id: 'pk_4', name: 'Mme ZONGO Pauline', relation: 'Tante', phone: '+226 60 11 22 33' },
    ],
    total_fees: 160000,
    discount: 10000,
    paid_amount: 150000,
    created_at: '2025-09-03T09:15:00Z',
  },
  // Primaire CP1
  {
    id: 'std_pri_cp1',
    school_id: 'sch_wend_panga',
    student_number: 'GSWP-25-0045',
    first_name: 'Ramatou',
    last_name: 'SANOU',
    birth_date: '2019-06-18',
    birth_place: 'Bobo-Dioulasso',
    gender: 'F',
    class_id: 'cls_cp1',
    cycle: 'primary',
    academic_year_id: '2025-2026',
    parent_name: 'M. SANOU Bakary',
    parent_relation: 'father',
    parent_phone: '+226 74 12 55 88',
    parent_profession: 'Ingénieur BTP',
    parent_address: 'Pissy',
    authorized_pickups: [
      { id: 'pk_5', name: 'Mme SANOU Fanta', relation: 'Mère', phone: '+226 76 99 88 11' },
    ],
    total_fees: 140000,
    discount: 0,
    paid_amount: 70000,
    created_at: '2025-09-04T10:00:00Z',
  },
  // Primaire CM2 (Candidats CEP)
  {
    id: 'std_pri_cm2_1',
    school_id: 'sch_wend_panga',
    student_number: 'GSWP-25-0098',
    first_name: 'Souleymane',
    last_name: 'TRAORÉ',
    birth_date: '2014-02-10',
    birth_place: 'Ouagadougou',
    gender: 'M',
    class_id: 'cls_cm2',
    cycle: 'primary',
    academic_year_id: '2025-2026',
    is_cep_candidate: true,
    parent_name: 'M. TRAORÉ Idriss',
    parent_relation: 'father',
    parent_phone: '+226 70 55 66 77',
    parent_profession: 'Fonctionnaire d\'État',
    parent_address: 'Patte d\'Oie',
    authorized_pickups: [],
    total_fees: 155000,
    discount: 0,
    paid_amount: 155000,
    created_at: '2025-09-01T08:00:00Z',
  },
  {
    id: 'std_pri_cm2_2',
    school_id: 'sch_wend_panga',
    student_number: 'GSWP-25-0104',
    first_name: 'Aminata Priscille',
    last_name: 'ZOUNGRANA',
    birth_date: '2014-08-25',
    birth_place: 'Kaya',
    gender: 'F',
    class_id: 'cls_cm2',
    cycle: 'primary',
    academic_year_id: '2025-2026',
    is_cep_candidate: true,
    parent_name: 'Mme ZOUNGRANA Bernadette',
    parent_relation: 'mother',
    parent_phone: '+226 77 44 11 22',
    parent_profession: 'Enseignante',
    parent_address: 'Cissin',
    authorized_pickups: [],
    total_fees: 155000,
    discount: 15000,
    paid_amount: 90000,
    created_at: '2025-09-01T09:00:00Z',
  },
  {
    id: 'std_pri_cm2_3',
    school_id: 'sch_wend_panga',
    student_number: 'GSWP-25-0107',
    first_name: 'Moctar',
    last_name: 'BARRY',
    birth_date: '2013-12-05',
    birth_place: 'Dori',
    gender: 'M',
    class_id: 'cls_cm2',
    cycle: 'primary',
    academic_year_id: '2025-2026',
    is_cep_candidate: true,
    parent_name: 'M. BARRY Amadou',
    parent_relation: 'father',
    parent_phone: '+226 70 99 22 11',
    parent_profession: 'Commerçant',
    parent_address: 'Tampouy',
    authorized_pickups: [],
    total_fees: 155000,
    discount: 0,
    paid_amount: 50000,
    created_at: '2025-09-01T10:30:00Z',
  },
];

const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: 'pay_001',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    student_id: 'std_pri_cm2_1',
    student_name: 'TRAORÉ Souleymane',
    student_number: 'GSWP-25-0098',
    class_id: 'cls_cm2',
    class_name: 'CM2 Promotion CEP',
    receipt_number: 'REC-2026-C1-00101',
    amount_fcfa: 75000,
    amount_in_words: 'Soixante-quinze mille francs CFA',
    payment_method: 'ORANGE_MONEY',
    transaction_ref: 'OM260915.1042',
    fee_category: 'SCOLARITE',
    period_label: 'Tranche 1',
    total_paid_after: 75000,
    remaining_balance_after: 80000,
    cashier_id: 'usr_cpt',
    cashier_name: 'Mme COMPAORÉ Aminata',
    is_cancelled: false,
    print_count: 1,
    created_at: '2025-09-15T09:12:00Z',
  },
  {
    id: 'pay_002',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    student_id: 'std_pri_cm2_1',
    student_name: 'TRAORÉ Souleymane',
    student_number: 'GSWP-25-0098',
    class_id: 'cls_cm2',
    class_name: 'CM2 Promotion CEP',
    receipt_number: 'REC-2026-C1-00102',
    amount_fcfa: 80000,
    amount_in_words: 'Quatre-vingts mille francs CFA',
    payment_method: 'CASH',
    fee_category: 'SCOLARITE',
    period_label: 'Solde Tranche 2 & 3',
    total_paid_after: 155000,
    remaining_balance_after: 0,
    cashier_id: 'usr_cpt',
    cashier_name: 'Mme COMPAORÉ Aminata',
    is_cancelled: false,
    print_count: 1,
    created_at: '2026-01-10T11:45:00Z',
  },
  {
    id: 'pay_003',
    school_id: 'sch_wend_panga',
    academic_year_id: '2025-2026',
    student_id: 'std_mat_1',
    student_name: 'OUÉDRAOGO Wend-Kuni Inès',
    student_number: 'GSWP-25-0012',
    class_id: 'cls_ps',
    class_name: 'Petite Section (Les Poussins)',
    receipt_number: 'REC-2026-C1-00103',
    amount_fcfa: 60000,
    amount_in_words: 'Soixante mille francs CFA',
    payment_method: 'MOOV_MONEY',
    transaction_ref: 'MOOV882914',
    fee_category: 'INSCRIPTION',
    period_label: 'Inscription + Tranche 1',
    total_paid_after: 60000,
    remaining_balance_after: 100000,
    cashier_id: 'usr_sec',
    cashier_name: 'Mme TRAORÉ Mariam',
    is_cancelled: false,
    print_count: 1,
    created_at: '2025-09-08T08:30:00Z',
  },
];

class StorageService {
  constructor() {
    this.initDefaults();
  }

  private notifyStorageChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  }

  private initDefaults(): void {
    if (!localStorage.getItem(STORAGE_KEYS.ALL_SCHOOLS)) {
      localStorage.setItem(STORAGE_KEYS.ALL_SCHOOLS, JSON.stringify(DEFAULT_SCHOOLS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALL_USERS)) {
      localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(DEFAULT_USERS));
    } else {
      // Vérifier et ajouter les admins d'établissement par défaut s'ils manquent
      try {
        const storedUsers: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALL_USERS) || '[]');
        let updated = false;
        DEFAULT_USERS.filter((u) => u.role === 'school_admin').forEach((adm) => {
          if (!storedUsers.some((u) => u.school_id === adm.school_id && u.role === 'school_admin')) {
            storedUsers.unshift(adm);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(storedUsers));
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_CODE)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_CODE, DEFAULT_SCHOOLS[0].access_code);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOL_CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(DEFAULT_SCHOOL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(DEFAULT_PAYMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
    }
  }

  // --- MULTI-TENANT & SCHOOLS MANAGEMENT ---
  public getAllSchools(): SchoolConfig[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_SCHOOLS);
    return raw ? JSON.parse(raw) : DEFAULT_SCHOOLS;
  }

  public saveAllSchools(schools: SchoolConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.ALL_SCHOOLS, JSON.stringify(schools));
    this.notifyStorageChange();
  }

  public getSchoolByCode(code: string): SchoolConfig | undefined {
    const clean = code.trim().toUpperCase();
    return this.getAllSchools().find(
      (s) => s.access_code.trim().toUpperCase() === clean
    );
  }

  public getActiveSchoolCode(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_CODE);
  }

  public setActiveSchoolCode(code: string | null): void {
    if (code) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_CODE, code.trim().toUpperCase());
      const school = this.getSchoolByCode(code);
      if (school) {
        localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(school));
        // Switch to director or first user of this school
        const users = this.getUsersBySchool(school.id);
        if (users.length > 0) {
          this.setCurrentUser(users[0]);
        }
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SCHOOL_CODE);
    }
  }

  public getSchoolConfig(): SchoolConfig {
    const activeCode = this.getActiveSchoolCode();
    if (activeCode) {
      const found = this.getSchoolByCode(activeCode);
      if (found) return found;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOL_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_SCHOOL;
  }

  public saveSchoolConfig(config: SchoolConfig): void {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(config));
    // Also sync in all schools
    const all = this.getAllSchools();
    const idx = all.findIndex((s) => s.id === config.id);
    if (idx !== -1) {
      all[idx] = config;
    } else {
      all.push(config);
    }
    this.saveAllSchools(all);
    this.notifyStorageChange();
  }

  public updateSchoolSubscription(
    schoolId: string,
    subscriptionUpdate: Partial<SchoolConfig['subscription']>
  ): void {
    const all = this.getAllSchools();
    const idx = all.findIndex((s) => s.id === schoolId);
    if (idx !== -1) {
      all[idx].subscription = {
        ...all[idx].subscription,
        ...subscriptionUpdate,
      };
      this.saveAllSchools(all);
      // Sync if it is the active school
      const current = this.getSchoolConfig();
      if (current.id === schoolId) {
        current.subscription = all[idx].subscription;
        localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(current));
      }
      this.logAudit(
        'SUBSCRIPTION_UPDATED',
        `Abonnement de l'école ${all[idx].name} mis à jour : Statut ${all[idx].subscription.status}, échéance ${all[idx].subscription.expires_at}`
      );
    }
  }

  public createSchool(newSchool: SchoolConfig, defaultAdminPin: string = '5544'): void {
    const all = this.getAllSchools();
    all.push(newSchool);
    this.saveAllSchools(all);

    // Create Admin de l'Établissement with PIN set by Super Admin
    const adminUser: UserProfile = {
      id: `usr_${Date.now()}_admin`,
      name: `Administrateur - ${newSchool.name}`,
      email: `admin@${newSchool.access_code.toLowerCase()}.bf`,
      phone: newSchool.phone,
      role: 'school_admin',
      school_id: newSchool.id,
      pin: defaultAdminPin,
      is_active: true,
    };

    // Create a default director user for this new school
    const directorUser: UserProfile = {
      id: `usr_${Date.now()}_dir`,
      name: `Directeur - ${newSchool.name}`,
      email: newSchool.email || `direction@${newSchool.access_code.toLowerCase()}.bf`,
      phone: newSchool.phone,
      role: 'director',
      school_id: newSchool.id,
      pin: '1234',
      is_active: true,
    };

    const users = this.getAllUsers();
    users.push(adminUser, directorUser);
    this.saveAllUsers(users);

    this.logAudit('SCHOOL_CREATED', `Création du nouvel établissement ${newSchool.name} (Code: ${newSchool.access_code}) avec compte Administrateur`);
  }

  public deleteSchool(schoolId: string): void {
    let all = this.getAllSchools();
    all = all.filter((s) => s.id !== schoolId);
    this.saveAllSchools(all);

    // Also remove users associated
    let users = this.getAllUsers();
    users = users.filter((u) => u.school_id !== schoolId);
    this.saveAllUsers(users);
  }

  // --- USERS & PIN MANAGEMENT ---
  public getAllUsers(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  }

  public saveAllUsers(users: UserProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
    this.notifyStorageChange();
  }

  public getUsersBySchool(schoolId: string): UserProfile[] {
    return this.getAllUsers().filter((u) => u.school_id === schoolId && u.is_active !== false);
  }

  public getUsers(): UserProfile[] {
    const currentSchool = this.getSchoolConfig();
    return this.getUsersBySchool(currentSchool.id);
  }

  public updateUserPin(userId: string, newPin: string): void {
    const users = this.getAllUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].pin = newPin.trim();
      this.saveAllUsers(users);

      // If updating currently logged in user
      const current = this.getCurrentUser();
      if (current.id === userId) {
        current.pin = newPin.trim();
        this.setCurrentUser(current);
      }
      this.logAudit('PIN_UPDATED', `Mise à jour du code PIN de l'utilisateur ${users[idx].name}`);
    }
  }

  public saveUser(user: UserProfile): void {
    const users = this.getAllUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.saveAllUsers(users);
  }

  public getCurrentUser(): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      return JSON.parse(raw);
    }
    const currentSchool = this.getSchoolConfig();
    const schoolUsers = this.getUsersBySchool(currentSchool.id);
    return schoolUsers[0] || DEFAULT_USERS[0];
  }

  public setCurrentUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  // --- SECURITY / VERIFICATIONS ---
  public verifySuperAdminPin(pin: string): boolean {
    return pin.trim() === SUPER_ADMIN_PIN;
  }

  public verifyUserPin(userId: string, pin: string): boolean {
    const user = this.getAllUsers().find((u) => u.id === userId);
    if (!user) return false;
    return user.pin === pin.trim();
  }

  public checkSubscription(school: SchoolConfig): {
    isValid: boolean;
    status: SchoolConfig['subscription']['status'];
    daysRemaining: number;
    message?: string;
  } {
    const sub = school.subscription;
    if (!sub) {
      return { isValid: true, status: 'active', daysRemaining: 30 };
    }

    if (sub.status === 'suspended') {
      return {
        isValid: false,
        status: 'suspended',
        daysRemaining: 0,
        message: 'L\'accès de cet établissement a été temporairement suspendu par le Super Administrateur.',
      };
    }

    const expiryDate = new Date(sub.expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0 || sub.status === 'expired') {
      return {
        isValid: false,
        status: 'expired',
        daysRemaining,
        message: `L'abonnement de l'établissement a expiré le ${new Date(sub.expires_at).toLocaleDateString('fr-FR')}. Veuillez contacter le Super Administrateur pour régulariser.`,
      };
    }

    return {
      isValid: true,
      status: sub.status,
      daysRemaining,
    };
  }

  // --- CLASSES ---
  public getClasses(): SchoolClass[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return raw ? JSON.parse(raw) : DEFAULT_CLASSES;
  }

  public saveClasses(classes: SchoolClass[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    this.notifyStorageChange();
  }

  public getClassById(id: string): SchoolClass | undefined {
    return this.getClasses().find((c) => c.id === id);
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : DEFAULT_STUDENTS;
  }

  public saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.notifyStorageChange();
  }

  public getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id);
  }

  public addStudent(student: Student): void {
    const students = this.getStudents();
    students.push(student);
    this.saveStudents(students);
    this.logAudit('STUDENT_ENROLLED', `Inscription de l'élève ${student.last_name} ${student.first_name} (${student.student_number})`);
  }

  public updateStudent(student: Student): void {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === student.id);
    if (idx !== -1) {
      students[idx] = student;
      this.saveStudents(students);
    }
  }

  // --- PAYMENTS & CAISSE ---
  public getPayments(): Payment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : DEFAULT_PAYMENTS;
  }

  public savePayments(payments: Payment[]): void {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    this.notifyStorageChange();
  }

  public addPayment(payment: Payment): void {
    const payments = this.getPayments();
    payments.unshift(payment);
    this.savePayments(payments);

    // Mettre à jour la situation financière de l'élève
    const student = this.getStudentById(payment.student_id);
    if (student) {
      student.paid_amount += payment.amount_fcfa;
      this.updateStudent(student);
    }

    // Incrémenter le compteur de reçu
    const school = this.getSchoolConfig();
    school.receipt_counter += 1;
    this.saveSchoolConfig(school);

    this.logAudit('PAYMENT_CREATED', `Encaissement de ${payment.amount_fcfa} FCFA (${payment.receipt_number}) pour ${payment.student_name}`);
  }

  public cancelPayment(paymentId: string, reason: string, cancelledBy: string): boolean {
    const payments = this.getPayments();
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment || payment.is_cancelled) return false;

    payment.is_cancelled = true;
    payment.cancellation_reason = reason;
    payment.cancelled_by = cancelledBy;
    payment.cancelled_at = new Date().toISOString();

    // Déduire du total payé de l'élève
    const student = this.getStudentById(payment.student_id);
    if (student) {
      student.paid_amount = Math.max(0, student.paid_amount - payment.amount_fcfa);
      this.updateStudent(student);
    }

    this.savePayments(payments);
    this.logAudit('PAYMENT_CANCELLED', `Annulation du reçu ${payment.receipt_number} de ${payment.amount_fcfa} FCFA. Motif: ${reason}`);
    return true;
  }

  public incrementPaymentPrintCount(paymentId: string): void {
    const payments = this.getPayments();
    const payment = payments.find((p) => p.id === paymentId);
    if (payment) {
      payment.print_count = (payment.print_count || 1) + 1;
      this.savePayments(payments);
    }
  }

  // --- ATTENDANCE ---
  public getAttendances(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCES);
    return raw ? JSON.parse(raw) : [];
  }

  public saveAttendances(records: AttendanceRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(records));
  }

  public getAttendanceByClassAndDate(classId: string, date: string): AttendanceRecord | undefined {
    return this.getAttendances().find((a) => a.class_id === classId && a.date === date);
  }

  public setAttendance(record: AttendanceRecord): void {
    const list = this.getAttendances();
    const idx = list.findIndex((a) => a.class_id === record.class_id && a.date === record.date);
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.saveAttendances(list);
  }

  // --- ASSESSMENTS & NOTES (PRIMAIRE) ---
  public getAssessments(): Assessment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveAssessments(assessments: Assessment[]): void {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
  }

  public addOrUpdateAssessment(assessment: Assessment): void {
    const list = this.getAssessments();
    const idx = list.findIndex((a) => a.id === assessment.id);
    if (idx !== -1) {
      list[idx] = assessment;
    } else {
      list.push(assessment);
    }
    this.saveAssessments(list);
    this.logAudit('ASSESSMENT_SAVED', `Enregistrement notes ${assessment.title} (${assessment.period})`);
  }

  // --- MATERNELLE (BILANS & JOURNAL) ---
  public getKindergartenReports(): KindergartenReport[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KINDERGARTEN_REPORTS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveKindergartenReport(report: KindergartenReport): void {
    const list = this.getKindergartenReports();
    const idx = list.findIndex((r) => r.student_id === report.student_id && r.period === report.period);
    if (idx !== -1) {
      list[idx] = report;
    } else {
      list.push(report);
    }
    localStorage.setItem(STORAGE_KEYS.KINDERGARTEN_REPORTS, JSON.stringify(list));
  }

  public getKindergartenDailyLogs(): KindergartenDailyLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KINDERGARTEN_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveKindergartenDailyLog(log: KindergartenDailyLog): void {
    const list = this.getKindergartenDailyLogs();
    const idx = list.findIndex((l) => l.class_id === log.class_id && l.date === log.date);
    if (idx !== -1) {
      list[idx] = log;
    } else {
      list.push(log);
    }
    localStorage.setItem(STORAGE_KEYS.KINDERGARTEN_LOGS, JSON.stringify(list));
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public logAudit(action: string, details: string): void {
    const user = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_name: user?.name || 'Système',
      user_role: user?.role || 'user',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    const list = this.getAuditLogs();
    list.unshift(newLog);
    if (list.length > 200) list.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(list));
  }

  // --- WHATSAPP LOGS ---
  public getWhatsAppLogs(): WhatsAppMessageLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WHATSAPP_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public logWhatsApp(msg: Omit<WhatsAppMessageLog, 'id' | 'created_at'>): void {
    const newEntry: WhatsAppMessageLog = {
      ...msg,
      id: `wlg_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const list = this.getWhatsAppLogs();
    list.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(list));
  }
}

export const storage = new StorageService();
