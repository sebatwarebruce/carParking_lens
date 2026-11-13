import { formatMoney } from '@/utils/format.js';
/** Displays a server-provided integer amount. Never computes. */
export default function Money({ amount, currency = 'RWF', className }) {
  return <span className={`tabular ${className || ''}`}>{formatMoney(amount, currency)}</span>;
}
