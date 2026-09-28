/**
 * Conversion d'un montant entier en toutes lettres (Français d'Afrique de l'Ouest / UEMOA)
 * Exemple: 35000 -> "Trente-cinq mille francs CFA"
 */

const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
];

const TENS = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'
];

function convertLessThanHundred(n: number): string {
  if (n < 20) return UNITS[n];
  const ten = Math.floor(n / 10);
  const unit = n % 10;

  if (ten === 7) {
    if (unit === 1) return 'soixante-et-onze';
    return `soixante-${UNITS[10 + unit]}`;
  }

  if (ten === 8) {
    if (unit === 0) return 'quatre-vingts';
    return `quatre-vingt-${UNITS[unit]}`;
  }

  if (ten === 9) {
    return `quatre-vingt-${UNITS[10 + unit]}`;
  }

  if (unit === 1) {
    return `${TENS[ten]}-et-un`;
  }

  if (unit === 0) {
    return TENS[ten];
  }

  return `${TENS[ten]}-${UNITS[unit]}`;
}

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  let result = '';
  if (hundred === 1) {
    result = 'cent';
  } else if (hundred > 1) {
    result = `${UNITS[hundred]} cent${remainder === 0 ? 's' : ''}`;
  }

  if (remainder > 0) {
    const remStr = convertLessThanHundred(remainder);
    result = result ? `${result} ${remStr}` : remStr;
  }

  return result;
}

export function numberToWordsFcfa(amount: number): string {
  if (amount === 0) return 'Zéro franc CFA';
  if (amount < 0) return `Moins ${numberToWordsFcfa(Math.abs(amount))}`;

  let n = Math.floor(amount);

  const billions = Math.floor(n / 1000000000);
  n %= 1000000000;
  const millions = Math.floor(n / 1000000);
  n %= 1000000;
  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;

  const parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) {
      parts.push('un milliard');
    } else {
      parts.push(`${convertLessThanThousand(billions)} milliards`);
    }
  }

  if (millions > 0) {
    if (millions === 1) {
      parts.push('un million');
    } else {
      parts.push(`${convertLessThanThousand(millions)} millions`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('mille');
    } else {
      parts.push(`${convertLessThanThousand(thousands)} mille`);
    }
  }

  if (remainder > 0) {
    parts.push(convertLessThanThousand(remainder));
  }

  const rawWords = parts.join(' ').trim();
  // Capitaliser la première lettre et ajouter "francs CFA"
  const formatted = rawWords.charAt(0).toUpperCase() + rawWords.slice(1);
  return `${formatted} francs CFA`;
}
