import { ICONS } from './icons.js';

// Labels and tones only. These do NOT decide which transitions are allowed; the server does (allowedActions).
export const SESSION_STATUS = {
  ACTIVE: { label: 'Parked', tone: 'info', icon: ICONS.slot.OCCUPIED },
  EXIT_PENDING: { label: 'Awaiting payment', tone: 'warning', icon: ICONS.payment.PENDING },
  PAYMENT_PENDING: { label: 'Payment pending', tone: 'warning', icon: ICONS.payment.PENDING },
  PAYMENT_FAILED: { label: 'Payment failed', tone: 'danger', icon: ICONS.payment.FAILED },
  DISPUTED: { label: 'Needs manager', tone: 'danger', icon: ICONS.warning },
  COMPLETED: { label: 'Completed', tone: 'success', icon: ICONS.payment.SUCCESS },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: ICONS.payment.CANCELLED },
};

export const PAYMENT_STATUS = {
  PENDING: { label: 'Pending confirmation', tone: 'warning', icon: ICONS.payment.PENDING },
  SUCCESS: { label: 'Confirmed', tone: 'success', icon: ICONS.payment.SUCCESS },
  FAILED: { label: 'Not confirmed', tone: 'danger', icon: ICONS.payment.FAILED },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: ICONS.payment.CANCELLED },
  REFUNDED: { label: 'Refunded', tone: 'info', icon: ICONS.payment.REFUNDED },
};

export const SLOT_STATUS = {
  AVAILABLE: { label: 'Available', tone: 'success', icon: ICONS.slot.AVAILABLE },
  OCCUPIED: { label: 'Occupied', tone: 'danger', icon: ICONS.slot.OCCUPIED },
  OUT_OF_SERVICE: { label: 'Out of service', tone: 'neutral', icon: ICONS.slot.OUT_OF_SERVICE },
};

export const TERMINAL_PAYMENT = ['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'];
export const OPEN_SESSION_STATUSES = ['ACTIVE', 'EXIT_PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'DISPUTED'];
