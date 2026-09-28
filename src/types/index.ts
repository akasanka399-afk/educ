export type UserRole = 'school_admin' | 'founder' | 'director' | 'accountant' | 'secretary' | 'teacher';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  school_id: string;
  pin: string; // Code PIN d'accès (ex: '1234')
  assigned_class_ids?: string[];
  avatar?: string;
  is_active?: boolean;
}

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'suspended';
export type SubscriptionPlan = 'monthly' | 'quarterly' | 'annual';

export interface SchoolSubscription {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  start_date: string;
  expires_at: string;
  price_fcfa: number;
  last_payment_date?: string;
  notes?: string;
}

export type CycleType = 'kindergarten' | 'primary';

export interface SubjectConfig {
  id: string;
  name: string;
  code: string;
  coefficient: number;
  max_score: number; // 10 or 20
  category: 'fondamentale' | 'eveil' | 'sport';
}

export interface SchoolClass {
  id: string;
  school_id: string;
  academic_year_id: string;
  cycle: CycleType;
  level: string; // PS, MS, GS, CP1, CP2, CE1, CE2, CM1, CM2
  name: string;
  capacity: number;
  head_teacher_id?: string;
  subjects: SubjectConfig[];
}

export interface AuthorizedPickup {
  id: string;
  name: string;
  relation: string;
  phone: string;
  cni?: string;
}

export interface Student {
  id: string;
  school_id: string;
  student_number: string; // e.g. "WEN-2025-0042"
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  gender: 'M' | 'F';
  photo_url?: string;
  blood_group?: string; // ex: O+, A+, B+, AB+
  health_notes?: string;
  allergies?: string;
  
  parent_name: string;
  parent_relation: 'father' | 'mother' | 'tutor';
  parent_phone: string; // WhatsApp formatted +226...
  parent_profession?: string;
  parent_address?: string;
  
  authorized_pickups: AuthorizedPickup[];

  class_id: string;
  cycle: CycleType;
  academic_year_id: string;
  is_cep_candidate?: boolean;

  // Financial status in FCFA
  total_fees: number;
  discount: number;
  paid_amount: number;
  created_at: string;
}

export type PaymentMethod = 'CASH' | 'ORANGE_MONEY' | 'MOOV_MONEY' | 'BANK_TRANSFER';

export interface Payment {
  id: string;
  school_id: string;
  academic_year_id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  class_id: string;
  class_name: string;
  
  receipt_number: string;
  amount_fcfa: number;
  amount_in_words: string;
  payment_method: PaymentMethod;
  transaction_ref?: string;
  fee_category: 'INSCRIPTION' | 'SCOLARITE' | 'CANTINE' | 'TRANSPORT' | 'TENUE' | 'AUTRE';
  period_label?: string; // e.g. "Tranche 1", "Mois d'Octobre"
  
  total_paid_after: number;
  remaining_balance_after: number;
  
  cashier_id: string;
  cashier_name: string;
  is_cancelled: boolean;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  print_count: number;
  
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  class_id: string;
  date: string; // YYYY-MM-DD
  cycle: CycleType;
  records: {
    student_id: string;
    status: 'present' | 'absent_justified' | 'absent_unjustified' | 'late';
    arrival_time?: string;
    departure_time?: string;
    picked_up_by?: string;
    parent_alert_sent?: boolean;
  }[];
}

export interface AssessmentGrade {
  student_id: string;
  score: number;
  is_absent?: boolean;
}

export interface Assessment {
  id: string;
  school_id: string;
  class_id: string;
  subject_id: string;
  period: 'T1' | 'T2' | 'T3';
  type: 'INTERRO' | 'DEVOIR' | 'COMPOSITION';
  title: string;
  max_score: number;
  date: string;
  grades: AssessmentGrade[];
}

export interface ReportCardGrade {
  subject_id: string;
  subject_name: string;
  coefficient: number;
  max_score: number;
  average_score: number;
  weighted_score: number;
  appreciation: string;
}

export interface ReportCard {
  id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  class_id: string;
  class_name: string;
  period: 'T1' | 'T2' | 'T3';
  grades: ReportCardGrade[];
  total_weighted: number;
  total_max_weighted: number;
  period_average: number; // calculated on 10 or 20
  base_scale: number; // 10 or 20
  class_average: number;
  rank: number;
  total_students: number;
  absences_count: number;
  teacher_remarks: string;
  director_decision: string;
}

export type SkillLevel = 'ACQUIS' | 'EN_COURS' | 'A_ENCOURAGER';

export interface KindergartenSkill {
  id: string;
  label: string;
  level: SkillLevel;
}

export interface KindergartenDomain {
  id: string;
  title: string;
  skills: KindergartenSkill[];
  observation: string;
}

export interface KindergartenReport {
  id: string;
  student_id: string;
  class_id: string;
  period: 'T1' | 'T2' | 'T3';
  domains: KindergartenDomain[];
  general_observation: string;
  educator_signature_date: string;
}

export interface KindergartenDailyLog {
  id: string;
  class_id: string;
  date: string;
  activities_theme: string;
  meals_summary: string;
  nap_summary: string;
  incidents: string;
  reminders_to_parents: string;
}

export interface SchoolConfig {
  id: string;
  access_code: string; // Code unique d'accès pour l'établissement (ex: "WENDPANGA")
  name: string;
  short_code: string;
  motto: string;
  region: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  academic_year: string;
  active_modules: {
    kindergarten: boolean;
    primary: boolean;
  };
  cash_prefix: string;
  receipt_counter: number;
  stamp_text: string;
  subscription: SchoolSubscription;
  created_at?: string;
}

export interface ThermalPrinterSettings {
  connection_type: 'BLE' | 'USB' | 'BROWSER_PRINT';
  device_name?: string;
  paper_width: '80mm' | '58mm';
  density: 'light' | 'medium' | 'dark';
  auto_cut: boolean;
  open_cash_drawer: boolean;
  print_logo: boolean;
}

export interface AuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface WhatsAppMessageLog {
  id: string;
  student_id?: string;
  recipient_name: string;
  phone: string;
  template_type: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  created_at: string;
}
