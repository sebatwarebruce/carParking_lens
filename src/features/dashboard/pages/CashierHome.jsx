import { Link } from 'react-router-dom';
import { useLot } from '@/context/LotContext.jsx';
import { formatMoney, todayISO } from '@/utils/format.js';
import { ICONS } from '@/constants/icons.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { KpiCard, Panel } from '../components/parts.jsx';
import PaymentQueue from '@/features/payments/components/PaymentQueue.jsx';

export default function CashierHome() {
  const { lotId } = useLot();
  const dash = useDashboard({ lotId, from: todayISO(), to: todayISO() }, !!lotId);
  const d = dash.data;
  return (
    <>
      <PageHeader title="Cashier" description="Settle exits, confirm cash and check mobile money status." />
      {dash.isPending ? <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div> : d && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="In payment queue" value={d.cashier.queueCount} icon={ICONS.payments} hint="Exited, not yet settled" to="/payments" />
          <KpiCard label="Awaiting provider" value={d.cashier.pendingCount} icon={ICONS.payment.PENDING} tone="warning" hint="Mobile money pending" />
          <KpiCard label="Cash confirmed today" value={formatMoney(d.cashier.cashConfirmedToday)} icon={ICONS.cash} />
          <KpiCard label="Confirmed today" value={formatMoney(d.confirmedRevenue)} icon={ICONS.payment.SUCCESS} tone="success" hint="Cash and mobile money" />
        </div>
      )}
      <Panel title="Payment queue" action={<Link to="/receipts" className="text-sm text-accent-text hover:underline">Receipts</Link>}><PaymentQueue lotId={lotId} /></Panel>
    </>
  );
}
