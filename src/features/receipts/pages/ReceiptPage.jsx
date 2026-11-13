import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileDown, Printer, Share2 } from 'lucide-react';
import { receiptService } from '@/services/receiptService.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { P } from '@/constants/permissions.js';
import { downloadReceiptPdf } from '@/utils/pdf.js';
import { formatMoney } from '@/utils/format.js';
import Button from '@/components/ui/Button.jsx';
import { QueryState } from '@/components/feedback/States.jsx';
import ReceiptView from '../components/ReceiptView.jsx';

export default function ReceiptPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['receipts', 'one', id], queryFn: () => receiptService.get(id), staleTime: 30_000 });
  const reprint = useGuardedMutation(() => receiptService.reprint(id), { onSuccess: (r) => { qc.setQueryData(['receipts', 'one', id], r); toast.success('Reprint recorded.'); setTimeout(() => window.print(), 100); } });
  const pdf = useGuardedMutation((r) => downloadReceiptPdf(r), { onError: () => toast.error('Could not create the PDF. Try printing instead.') });
  const share = async (r) => {
    const text = `Parking receipt ${r.receiptNumber}: ${formatMoney(r.total, r.currency)} paid for ticket ${r.ticketNumber}.`;
    try { if (navigator.share) await navigator.share({ title: 'Parking receipt', text }); else { await navigator.clipboard.writeText(text); toast.success('Receipt summary copied.'); } } catch { /* cancelled */ }
  };
  return (
    <div className="mx-auto max-w-md">
      <Link to="/receipts" className="no-print mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden />Receipts</Link>
      <QueryState query={q} rows={5}>
        {(r) => (
          <div className="space-y-4">
            <ReceiptView r={r} />
            <div className="no-print grid grid-cols-2 gap-2">
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
              <Button variant="secondary" icon={FileDown} loading={pdf.isSubmitting} onClick={() => pdf.mutate(r)}>Download PDF</Button>
              <Button variant="secondary" icon={Share2} onClick={() => share(r)}>Share</Button>
              {can(P.RECEIPTS_REPRINT) && <Button icon={Printer} loading={reprint.isSubmitting} onClick={() => reprint.mutate()}>Reprint (audited)</Button>}
            </div>
            {reprint.error && <p role="alert" className="text-sm text-danger">{reprint.error.message}</p>}
          </div>
        )}
      </QueryState>
    </div>
  );
}
