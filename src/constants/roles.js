export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  PARKING_OWNER: 'PARKING_OWNER',
  MANAGER: 'MANAGER',
  ATTENDANT: 'ATTENDANT',
  CASHIER: 'CASHIER',
});

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Platform admin',
  PARKING_OWNER: 'Parking owner',
  MANAGER: 'Manager',
  ATTENDANT: 'Attendant',
  CASHIER: 'Cashier',
};

// Where each role lands after sign in (UX only; the backend decides what data they can read).
export const ROLE_HOME = {
  SUPER_ADMIN: '/platform',
  PARKING_OWNER: '/dashboard',
  MANAGER: '/dashboard',
  ATTENDANT: '/home',
  CASHIER: '/cashier',
};

export const STAFF_ROLES = ['PARKING_OWNER', 'MANAGER', 'ATTENDANT', 'CASHIER'];
