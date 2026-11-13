import { ICONS } from './icons.js';
export const PAYMENT_METHODS = {
  CASH: { label: 'Cash', icon: ICONS.cash, needsPhone: false },
  MTN_MOMO: { label: 'MTN MoMo', icon: ICONS.mobileMoney, needsPhone: true },
  AIRTEL_MONEY: { label: 'Airtel Money', icon: ICONS.mobileMoney, needsPhone: true },
  CARD: { label: 'Card', icon: ICONS.card, needsPhone: false },
  BANK: { label: 'Bank', icon: ICONS.card, needsPhone: false },
};
export const methodLabel = (m) => PAYMENT_METHODS[m]?.label ?? m;
export const isMobileMoney = (m) => m === 'MTN_MOMO' || m === 'AIRTEL_MONEY';
