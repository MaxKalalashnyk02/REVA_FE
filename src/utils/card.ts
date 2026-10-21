export const CARD_NUMBER_LENGTH = 16;

export function sanitizeCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, CARD_NUMBER_LENGTH);
}

export function isValidCardNumber(value: string): boolean {
  return new RegExp(`^\\d{${CARD_NUMBER_LENGTH}}$`).test(value);
}

export function maskCardNumber(value: string): string {
  if (!isValidCardNumber(value)) return value;
  return `${value.slice(0, 6)}${'*'.repeat(CARD_NUMBER_LENGTH - 10)}${value.slice(-4)}`;
}
