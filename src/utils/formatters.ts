/**
 * Utilitaires de formatage spécifiques au Burkina Faso (FCFA, Téléphones, Dates)
 */

export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
}

export function formatDateFR(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTimeFR(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return dateString;
  }
}

/**
 * Normalise un numéro burkinabè pour WhatsApp international (+226...)
 * Accepte les formats : "70 12 34 56", "22670123456", "+226 70123456", "01234567"
 */
export function normalizeBurkinaPhone(raw: string): string {
  if (!raw) return '';
  // Garder seulement les chiffres
  let digits = raw.replace(/\D/g, '');

  // Si commence déjà par 226
  if (digits.startsWith('226') && digits.length === 11) {
    return digits;
  }

  // Si c'est un numéro local burkinabè à 8 chiffres
  if (digits.length === 8) {
    return `226${digits}`;
  }

  return digits;
}

/**
 * Détecte l'opérateur mobile au Burkina Faso
 */
export function detectOperator(phone: string): 'Orange' | 'Moov' | 'Telecel' | 'Autre' {
  const norm = normalizeBurkinaPhone(phone);
  const local8 = norm.startsWith('226') ? norm.slice(3) : norm;
  if (local8.length < 2) return 'Autre';
  const prefix = local8.slice(0, 2);

  // Préfixes Orange BF : 04, 05, 06, 07, 54, 55, 56, 57, 74, 75, 76, 77
  if (['04', '05', '06', '07', '54', '55', '56', '57', '74', '75', '76', '77'].includes(prefix)) {
    return 'Orange';
  }
  // Préfixes Moov Africa BF : 01, 02, 03, 50, 51, 52, 53, 60, 61, 62, 63, 70, 71, 72, 73
  if (['01', '02', '03', '50', '51', '52', '53', '60', '61', '62', '63', '70', '71', '72', '73'].includes(prefix)) {
    return 'Moov';
  }
  // Préfixes Telecel Faso : 58, 59, 68, 69, 78, 79
  if (['58', '59', '68', '69', '78', '79'].includes(prefix)) {
    return 'Telecel';
  }

  return 'Autre';
}

export function displayPhoneFR(phone: string): string {
  const norm = normalizeBurkinaPhone(phone);
  if (norm.length === 11 && norm.startsWith('226')) {
    const p1 = norm.slice(3, 5);
    const p2 = norm.slice(5, 7);
    const p3 = norm.slice(7, 9);
    const p4 = norm.slice(9, 11);
    return `+226 ${p1} ${p2} ${p3} ${p4}`;
  }
  return phone;
}
