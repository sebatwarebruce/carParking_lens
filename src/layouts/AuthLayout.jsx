import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/feedback/OfflineBanner.jsx';
import { DemoBanner } from '@/components/feedback/DemoTools.jsx';
export default function AuthLayout() {
  return (
    <div className="min-h-dvh">
      <DemoBanner /><OfflineBanner />
      <Outlet />
    </div>
  );
}
