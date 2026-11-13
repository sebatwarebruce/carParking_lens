import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTheme } from '@/app/providers/ThemeProvider.jsx';
import { ROLE_LABELS } from '@/constants/roles.js';
import { ICONS } from '@/constants/icons.js';
import { maskPhone } from '@/utils/format.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import { Timestamp } from '@/components/common/Time.jsx';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const RoleIcon = ICONS.role[user.role];
  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Profile" />
      <Card className="space-y-4">
        <div className="flex items-center gap-3"><span className="grid size-14 place-items-center rounded-full border border-line bg-surface2 text-accent-text"><RoleIcon size={26} aria-hidden /></span><div><p className="font-display text-xl">{user.name}</p><p className="text-sm text-muted">{ROLE_LABELS[user.role]} at {user.organizationName}</p></div></div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted">Email</dt><dd className="break-all">{user.email || '-'}</dd></div>
          <div><dt className="text-muted">Phone</dt><dd>{maskPhone(user.phone)}</dd></div>
          <div><dt className="text-muted">Last sign-in</dt><dd><Timestamp iso={user.lastLoginAt} /></dd></div>
          <div><dt className="text-muted">Locations</dt><dd>{user.lots.map((l) => l.name).join(', ') || 'All'}</dd></div>
        </dl>
        <p className="text-sm text-muted">To change your password, ask your manager to send a reset.</p>
      </Card>
      <Card><CardTitle>Appearance</CardTitle><Button variant="secondary" icon={theme === 'dark' ? Sun : Moon} onClick={toggle}>{theme === 'dark' ? 'Switch to cream theme' : 'Switch to dark theme'}</Button></Card>
      <Button variant="danger" icon={LogOut} onClick={logout}>Sign out</Button>
    </div>
  );
}
