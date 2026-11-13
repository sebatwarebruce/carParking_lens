import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { Field, Textarea } from '@/components/forms/Field.jsx';
import Alert from '@/components/feedback/Alert.jsx';

/** Confirmation (+ optional reason) for sensitive actions. Reasons are sent to the server and audited there. */
export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'primary', requireReason = false, reasonLabel = 'Reason', loading, error, children }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setReason(''); setTouched(false); } }, [open]);
  const tooShort = requireReason && reason.trim().length < 3;
  return (
    <Modal open={open} onClose={loading ? undefined : onClose} dismissible={!loading} title={title} description={description}
      footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button><Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={() => { setTouched(true); if (!tooShort) onConfirm(reason.trim()); }}>{confirmLabel}</Button></>}>
      <div className="space-y-4">
        {children}
        {requireReason && (
          <Field label={reasonLabel} required error={touched && tooShort ? 'Enter a short reason (at least 3 characters).' : undefined}>
            {(p) => <Textarea {...p} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this is needed" />}
          </Field>
        )}
        {error && <Alert tone="danger" live>{error.message}{error.fieldErrors?.reason ? ` ${error.fieldErrors.reason}` : ''}</Alert>}
      </div>
    </Modal>
  );
}
