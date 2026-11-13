import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/navigation/Sidebar.jsx';
import MobileDock from '@/components/navigation/MobileDock.jsx';
import Topbar from '@/components/navigation/Topbar.jsx';
import OfflineBanner from '@/components/feedback/OfflineBanner.jsx';
import DemoTools, { DemoBanner } from '@/components/feedback/DemoTools.jsx';

/** Authenticated chrome: sidebar (lg) / rail (md) / neumorphic dock (phones). One layout for every role; nav is role-filtered. */
export default function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only z-[200] rounded-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <OfflineBanner />
        <Topbar />
        <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-36 pt-5 md:px-6 md:pb-10 lg:px-8"><Outlet /></main>
      </div>
      <MobileDock />
      <DemoTools />
    </div>
  );
}
