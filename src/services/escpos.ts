import { Payment, SchoolConfig } from '../types';
import { formatFCFA, formatDateTimeFR } from '../utils/formatters';

/**
 * Générateur de commandes binaires ESC/POS pour imprimantes thermiques 80 mm et 58 mm
 */

export class EscPosBuilder {
  private buffer: number[] = [];
  private lineWidth: number;

  constructor(lineWidth: number = 48) {
    this.lineWidth = lineWidth;
    this.init();
  }

  // Initialisation imprimante
  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  // Alignement
  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02); // ESC a 2
    return this;
  }

  // Gras
  bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  // Taille du texte
  doubleSize(): this {
    this.buffer.push(0x1d, 0x21, 0x11); // GS ! 17 (Double hauteur + Double largeur)
    return this;
  }

  doubleHeight(): this {
    this.buffer.push(0x1d, 0x21, 0x01); // GS ! 1
    return this;
  }

  normalSize(): this {
    this.buffer.push(0x1d, 0x21, 0x00); // GS ! 0
    return this;
  }

  // Saut de ligne
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a); // LF
    }
    return this;
  }

  // Ajout de texte avec encodage
  text(str: string): this {
    // Nettoyer les accents complexes pour compatibilité standard imprimante POS
    const sanitized = this.sanitizeText(str);
    for (let i = 0; i < sanitized.length; i++) {
      this.buffer.push(sanitized.charCodeAt(i) & 0xff);
    }
    return this;
  }

  textLine(str: string = ''): this {
    this.text(str);
    this.feed(1);
    return this;
  }

  // Ligne de séparation
  divider(char: string = '-'): this {
    this.textLine(char.repeat(this.lineWidth));
    return this;
  }

  doubleDivider(): this {
    this.divider('=');
    return this;
  }

  // Ligne deux colonnes alignées (gauche / droite)
  twoColumnLine(left: string, right: string): this {
    const leftSan = this.sanitizeText(left);
    const rightSan = this.sanitizeText(right);
    const spacesNeeded = this.lineWidth - (leftSan.length + rightSan.length);

    if (spacesNeeded <= 0) {
      this.textLine(leftSan);
      this.alignRight().textLine(rightSan).alignLeft();
    } else {
      this.textLine(leftSan + ' '.repeat(spacesNeeded) + rightSan);
    }
    return this;
  }

  // QR Code natif ESC/POS
  qrCode(data: string): this {
    const qrData = this.sanitizeText(data);
    const length = qrData.length + 3;
    const pL = length % 256;
    const pH = Math.floor(length / 256);

    // Modèle QR 2
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Taille du module (taille 6)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06);
    // Correction d'erreur L (niveau M = 0x31)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // Données QR
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < qrData.length; i++) {
      this.buffer.push(qrData.charCodeAt(i) & 0xff);
    }
    // Commande d'impression du QR code
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    this.feed(1);
    return this;
  }

  // Découpe papier
  cut(partial: boolean = false): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, partial ? 0x01 : 0x00); // GS V 0 (Full Cut)
    return this;
  }

  // Ouverture tiroir-caisse
  openCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  // Obtenir le buffer final en Uint8Array
  toBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  private sanitizeText(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques pour éviter les artefacts bizarres sur imprimante chinoise/générique
      .replace(/[^\x20-\x7E\n\r]/g, ' '); // Conserve seulement les caractères imprimables ASCII
  }
}

/**
 * Génère le ticket de reçu complet au format ESC/POS binaire
 */
export function buildReceiptEscPos(
  payment: Payment,
  school: SchoolConfig,
  isDuplicate: boolean = false,
  paperWidth: '80mm' | '58mm' = '80mm',
  openDrawer: boolean = false,
  autoCut: boolean = true
): Uint8Array {
  const cols = paperWidth === '80mm' ? 48 : 32;
  const builder = new EscPosBuilder(cols);

  if (openDrawer) {
    builder.openCashDrawer();
  }

  // En-tête de l'école
  builder.alignCenter();
  builder.bold(true).doubleHeight();
  builder.textLine(school.name.toUpperCase());
  builder.normalSize().bold(false);
  builder.textLine(school.motto);
  builder.textLine(school.address + ' - ' + school.region);
  builder.textLine(`Tel: ${school.phone}`);
  builder.doubleDivider();

  // Titre du reçu
  builder.bold(true);
  if (isDuplicate || payment.print_count > 1) {
    builder.doubleHeight();
    builder.textLine('*** DUPLICATA DE RECU ***');
    builder.normalSize();
  } else {
    builder.textLine('RECU DE PAIEMENT OFFICIEL');
  }
  builder.bold(false);

  builder.alignLeft();
  builder.twoColumnLine('RECU N°:', payment.receipt_number);
  builder.twoColumnLine('DATE:', formatDateTimeFR(payment.created_at));
  builder.twoColumnLine('CAISSIER:', payment.cashier_name);
  builder.twoColumnLine('MODE REGLEMENT:', payment.payment_method.replace('_', ' '));
  if (payment.transaction_ref) {
    builder.twoColumnLine('REF TRANSACTION:', payment.transaction_ref);
  }
  builder.divider();

  // Élève
  builder.bold(true).textLine('INFORMATION ELEVE:').bold(false);
  builder.twoColumnLine('NOM & PRENOM:', payment.student_name);
  builder.twoColumnLine('MATRICULE:', payment.student_number);
  builder.twoColumnLine('CLASSE:', payment.class_name);
  builder.divider();

  // Motif & Montant
  builder.bold(true).textLine('MOTIF DU PAIEMENT:').bold(false);
  builder.textLine(`${payment.fee_category} - ${payment.period_label || 'Versement'}`);
  builder.feed(1);

  // Bloc Montant mis en valeur
  builder.alignCenter();
  builder.bold(true).doubleSize();
  builder.textLine(formatFCFA(payment.amount_fcfa));
  builder.normalSize().bold(false);
  builder.alignLeft();

  builder.textLine('Arrete a la somme de:');
  builder.bold(true).textLine(payment.amount_in_words).bold(false);
  builder.divider();

  // Situation financière après versement
  builder.bold(true).textLine('SITUATION FINANCIERE ELEVE:').bold(false);
  builder.twoColumnLine('Total deja regle:', formatFCFA(payment.total_paid_after));
  builder.bold(true);
  builder.twoColumnLine('RESTE A RECOUVRER:', formatFCFA(payment.remaining_balance_after));
  builder.bold(false);
  builder.divider();

  // QR Code de vérification
  builder.alignCenter();
  const qrVerificationData = `EDUNOVA:${school.id}|${payment.receipt_number}|${payment.student_number}|${payment.amount_fcfa}|${payment.created_at}`;
  builder.qrCode(qrVerificationData);
  builder.textLine('Scannez pour authentifier ce recu');
  builder.feed(1);

  // Mentions légales
  builder.textLine(school.stamp_text || 'Cachet et signature de la caisse');
  builder.textLine('Les frais verses ne sont pas remboursables.');
  builder.textLine('Conservez ce document comme piece justificative.');
  builder.doubleDivider();

  if (autoCut) {
    builder.cut();
  }

  return builder.toBytes();
}
