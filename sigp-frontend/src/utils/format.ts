export function formatMoney(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('fr-FR').format(num);
}
