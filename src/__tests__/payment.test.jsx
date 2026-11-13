import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import PaymentPanel from '@/features/payments/components/PaymentPanel.jsx';
import { renderApp } from './helpers.jsx';
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions.js';
import { AuthProvider } from '@/context/AuthContext.jsx';
import * as AuthCtx from '@/context/AuthContext.jsx';
import { vi } from 'vitest';

const checkout = { total: 2300, currency: 'RWF', enabledPaymentMethods: ['CASH', 'MTN_MOMO', 'AIRTEL_MONEY'], breakdown: [] };
const base = { id: 's1', vehicle: { ownerPhone: '0788123456', displayPlate: 'RAD 123 A' }, payments: [] };
const asRole = (role) => vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({ can: (p) => DEFAULT_ROLE_PERMISSIONS[role].includes(p), canAny: (l) => l.some((p) => DEFAULT_ROLE_PERMISSIONS[role].includes(p)), user: { role } });

describe('PaymentPanel trust rules', () => {
  it('while a payment is PENDING it says waiting, never "paid", and offers no new request', () => {
    asRole('CASHIER');
    const pending = { id: 'p1', sessionId: 's1', amount: 2300, method: 'MTN_MOMO', status: 'PENDING', transactionReference: 'TX-1', maskedPhone: '078****456', createdAt: new Date().toISOString() };
    renderApp(<PaymentPanel session={{ ...base, payments: [pending] }} checkout={checkout} />);
    expect(screen.getByText(/waiting for payment confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/this is not paid yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/payment confirmed/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request payment/i })).not.toBeInTheDocument();
  });

  it('shows the failure message and lets the operator try another method', () => {
    asRole('CASHIER');
    const failed = { id: 'p1', status: 'FAILED', method: 'MTN_MOMO', failureReason: 'Customer did not approve the request', amount: 2300 };
    renderApp(<PaymentPanel session={{ ...base, payments: [failed] }} checkout={checkout} />);
    expect(screen.getByText(/payment was not confirmed/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /cash/i })).toBeEnabled();
  });

  it('an attendant without cash permission cannot pick cash and is told to use the cashier', () => {
    asRole('ATTENDANT');
    renderApp(<PaymentPanel session={base} checkout={checkout} />);
    expect(screen.getByRole('radio', { name: /cash/i })).toBeDisabled();
    expect(screen.getByText(/confirmed by a cashier/i)).toBeInTheDocument();
  });
});
void AuthProvider;
