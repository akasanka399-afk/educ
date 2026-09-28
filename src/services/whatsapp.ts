import { normalizeBurkinaPhone, formatFCFA, formatDateFR } from '../utils/formatters';
import { Payment, Student, SchoolConfig } from '../types';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'FINANCES' | 'PEDAGOGIE' | 'VIE_SCOLAIRE' | 'ANNONCE';
  template: string;
}

export const PREDEFINED_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'receipt',
    title: 'Confirmation de versement (Reçu)',
    category: 'FINANCES',
    template: `*GROUPE SCOLAIRE {nom_ecole}*\n\nBonjour {nom_parent},\nNous vous confirmons l'encaissement de *{montant}* le {date} pour la scolarite de votre enfant *{nom_eleve}* ({classe}).\n\n- N° de recu : *{numero_recu}*\n- Mode : {mode_paiement}\n- Reste a payer : *{reste_a_payer}*\n\nMerci pour votre confiance.\nLa Direction - Tel: {tel_ecole}`,
  },
  {
    id: 'reminder',
    title: 'Rappel d\'impayé / Échéancier scolarité',
    category: 'FINANCES',
    template: `*GROUPE SCOLAIRE {nom_ecole}*\n\nBonjour {nom_parent},\nSauf erreur ou omission de notre part, le dossier de scolarite de votre enfant *{nom_eleve}* ({classe}) presente un reliquat impaye de *{reste_a_payer}*.\n\nNous vous prions de bien vouloir passer a la comptabilite pour la regularisation.\n\nCordialement,\nService Comptabilite - Tel: {tel_ecole}`,
  },
  {
    id: 'absence',
    title: 'Alerte d\'absence injustifiée ce matin',
    category: 'VIE_SCOLAIRE',
    template: `*GROUPE SCOLAIRE {nom_ecole} - ALERTE ASSIDUITE*\n\nBonjour {nom_parent},\nNous constatons l'absence ce jour de votre enfant *{nom_eleve}* en classe de *{classe}* lors de l'appel du matin.\n\nSi cette absence est motivee (maladie, urgence), merci de contacter rapidement la vie scolaire au {tel_ecole}.\n\nLe Directeur`,
  },
  {
    id: 'report_card',
    title: 'Bulletin de notes disponible',
    category: 'PEDAGOGIE',
    template: `*GROUPE SCOLAIRE {nom_ecole}*\n\nBonjour {nom_parent},\nLes bulletins du *{periode}* de la classe de *{classe}* sont disponibles.\n\nResultat de *{nom_eleve}* : \nMoyenne : *{moyenne}* | Rang : *{rang}*\n\nNous vous invitons a venir le retirer et echanger avec le maitre.\n\nLa Direction`,
  },
  {
    id: 'meeting',
    title: 'Convocation / Réunion des parents d\'élèves',
    category: 'ANNONCE',
    template: `*GROUPE SCOLAIRE {nom_ecole}*\n\nChers parents d'eleves de la classe de *{classe}*,\nUne rencontre pedagogique et d'echange aura lieu le samedi a 09h00 dans les locaux de l'etablissement.\n\nOrdre du jour : Bilan du trimestre et accompagnement des enfants.\nVotre presence est indispensable.\n\nLa Direction`,
  },
];

export class WhatsAppService {
  /**
   * Remplace les balises {cle} par les valeurs réelles
   */
  public interpolate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, val);
    }
    return result;
  }

  /**
   * Génère le lien universel wa.me
   */
  public generateWaMeLink(phone: string, text: string): string {
    const normalizedPhone = normalizeBurkinaPhone(phone);
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }

  /**
   * Ouvre directement WhatsApp dans un nouvel onglet ou application mobile
   */
  public openWhatsApp(phone: string, text: string): void {
    const link = this.generateWaMeLink(phone, text);
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  /**
   * Génère le message de reçu de paiement
   */
  public createPaymentMessage(
    payment: Payment,
    student: Student,
    school: SchoolConfig
  ): string {
    const template = PREDEFINED_TEMPLATES.find((t) => t.id === 'receipt')?.template || '';
    return this.interpolate(template, {
      nom_ecole: school.name,
      nom_parent: student.parent_name || 'Parent d\'élève',
      nom_eleve: `${student.last_name} ${student.first_name}`,
      classe: payment.class_name,
      montant: formatFCFA(payment.amount_fcfa),
      date: formatDateFR(payment.created_at),
      numero_recu: payment.receipt_number,
      mode_paiement: payment.payment_method.replace('_', ' '),
      reste_a_payer: formatFCFA(payment.remaining_balance_after),
      tel_ecole: school.phone,
    });
  }

  /**
   * Génère le message de rappel d'impayé
   */
  public createReminderMessage(
    student: Student,
    className: string,
    school: SchoolConfig
  ): string {
    const remaining = (student.total_fees - student.discount) - student.paid_amount;
    const template = PREDEFINED_TEMPLATES.find((t) => t.id === 'reminder')?.template || '';
    return this.interpolate(template, {
      nom_ecole: school.name,
      nom_parent: student.parent_name,
      nom_eleve: `${student.last_name} ${student.first_name}`,
      classe: className,
      reste_a_payer: formatFCFA(remaining),
      tel_ecole: school.phone,
    });
  }

  /**
   * Génère le message d'absence
   */
  public createAbsenceMessage(
    student: Student,
    className: string,
    school: SchoolConfig
  ): string {
    const template = PREDEFINED_TEMPLATES.find((t) => t.id === 'absence')?.template || '';
    return this.interpolate(template, {
      nom_ecole: school.name,
      nom_parent: student.parent_name,
      nom_eleve: `${student.last_name} ${student.first_name}`,
      classe: className,
      tel_ecole: school.phone,
    });
  }
}

export const whatsappService = new WhatsAppService();
