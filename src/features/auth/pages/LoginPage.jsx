import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Aperture, Eye, EyeOff, FlaskConical, KeyRound } from 'lucide-react';
import { loginSchema, forgotSchema } from '@/schemas/auth.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { authService } from '@/services/authService.js';
import { normalizeError } from '@/services/errors.js';
import { ROLE_HOME, ROLE_LABELS } from '@/constants/roles.js';
import { BRAND } from '@/constants/brand.js';
import { MSG } from '@/constants/messages.js';
import { env } from '@/app/config/env.js';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Field, Input } from '@/components/forms/Field.jsx';

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);
const DEMO = [
  ['attendant', 'Attendant'], ['cashier', 'Cashier'], ['manager', 'Manager'], ['owner', 'Owner'], ['admin', 'Platform admin'],
];

function SocialButtons({ providers, loading }) {
  const [busy, setBusy] = useState(null);
  const list = providers?.social?.length ? providers.social : [{ id: 'google', label: 'Google', enabled: false }, { id: 'apple', label: 'Apple', enabled: false }];
  const anyEnabled = list.some((p) => p.enabled);
  const start = async (p) => {
    setBusy(p.id);
    try { const { authorizationUrl } = await authService.startSocial(p.id, `${window.location.origin}/login`); window.location.assign(authorizationUrl); }
    catch { setBusy(null); }
  };
  return (
    <div className="space-y-2.5" aria-busy={loading}>
      {list.map((p) => (
        <Button key={p.id} variant="secondary" size="lg" className="w-full" disabled={!p.enabled || loading} loading={busy === p.id} onClick={() => start(p)}>
          <span className="grid size-6 place-items-center rounded-full bg-surface2 text-sm font-bold" aria-hidden>{p.label[0]}</span>Continue with {p.label}
        </Button>
      ))}
      {!anyEnabled && !loading && <p className="text-center text-sm text-muted">Social sign-in is not available yet. Use your email or phone below.</p>}
    </div>
  );
}

export default function LoginPage() {
  const { status, user, login, reason } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [, tick] = useState(0);
  const [forgot, setForgot] = useState(false);
  const providers = useQuery({ queryKey: ['auth', 'providers'], queryFn: authService.providers, staleTime: 5 * 60_000, retry: 0 });
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } });

  useEffect(() => { if (!lockedUntil) return; const t = setInterval(() => { tick((n) => n + 1); if (Date.now() >= lockedUntil) setLockedUntil(0); }, 1000); return () => clearInterval(t); }, [lockedUntil]);
  if (status === 'authenticated') return <Navigate to={safeNext(sp.get('next')) || ROLE_HOME[user.role]} replace />;

  const wait = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  const onSubmit = async (v) => {
    setError(null);
    try { const u = await login(v); nav(safeNext(sp.get('next')) || ROLE_HOME[u.role], { replace: true }); }
    catch (e) { const err = normalizeError(e); setError(err); if (err.kind === 'rateLimited') setLockedUntil(Date.now() + (err.retryAfterSeconds || 30) * 1000); }
  };
  const expired = reason === 'expired' || sp.get('reason') === 'expired';

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="lens-glow relative hidden overflow-hidden border-r border-line bg-raised p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3"><span className="lens-ring grid size-11 place-items-center bg-bg text-accent-text"><Aperture size={22} aria-hidden /></span><span className="font-display text-2xl">{BRAND.name}</span></div>
        <div className="max-w-md space-y-4">
          <h2 className="font-display text-5xl leading-[1.05]">Every vehicle in, out and paid for, on the record.</h2>
          <p className="text-lg text-muted">Entry photos, live spaces, server-calculated fees and confirmed payments in one place your whole team can trust.</p>
        </div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full border border-line opacity-60" aria-hidden><div className="lens-ring absolute inset-12 opacity-60" /></div>
      </aside>

      <main className="lens-glow mx-auto flex w-full max-w-md flex-col justify-center px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="lens-ring grid size-10 place-items-center bg-bg text-accent-text"><Aperture size={20} aria-hidden /></span><span className="font-display text-xl">{BRAND.name}</span></div>
          <h1 className="font-display text-3xl">Sign in</h1>
          <p className="mt-1 text-muted">{BRAND.tagline}</p>

          <div className="mt-6 space-y-3">
            {expired && <Alert tone="warning" live>{MSG.sessionExpired}</Alert>}
            <SocialButtons providers={providers.data} loading={providers.isPending} />
          </div>

          <div className="my-6 flex items-center gap-3 text-sm text-muted" role="separator"><span className="h-px flex-1 bg-line" />or use your email or phone<span className="h-px flex-1 bg-line" /></div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Field label="Email or phone" error={errors.identifier?.message} required>
              {(p) => <Input {...p} {...register('identifier')} type="text" autoComplete="username" inputMode="email" autoCapitalize="none" placeholder="name@company.com or 078..." />}
            </Field>
            <Field label="Password" error={errors.password?.message} required>
              {(p) => (
                <div className="relative">
                  <Input {...p} {...register('password')} type={show ? 'text' : 'password'} autoComplete="current-password" className="pr-12" />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute right-1 top-1 grid size-10 place-items-center rounded-md text-muted hover:text-ink">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              )}
            </Field>

            {error && (
              <Alert tone={error.kind === 'rateLimited' || error.kind === 'network' ? 'warning' : 'danger'} live title={error.code === 'ACCOUNT_DISABLED' ? 'Account disabled' : error.kind === 'rateLimited' ? 'Too many attempts' : error.kind === 'network' ? 'Connection lost' : 'Could not sign in'}>
                {error.kind === 'rateLimited' ? `Wait ${wait || 0} seconds before trying again.` : error.message}
              </Alert>
            )}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={wait > 0}>{wait > 0 ? `Try again in ${wait}s` : 'Sign in'}</Button>
            {providers.data?.passwordReset !== false && <button type="button" onClick={() => setForgot(true)} className="mx-auto flex min-h-11 items-center gap-1.5 text-sm text-accent-text underline-offset-4 hover:underline"><KeyRound size={15} aria-hidden />Forgot password?</button>}
          </form>

          {env.useMocks && (
            <div className="mt-8 rounded-lg border border-dashed border-line p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium"><FlaskConical size={16} aria-hidden className="text-accent-text" />Demo accounts (password: demo1234)</p>
              <p className="mb-3 text-xs text-muted">Mock sign-in for development only. It is not real authentication.</p>
              <div className="flex flex-wrap gap-2">
                {DEMO.map(([k, l]) => <button key={k} type="button" onClick={() => { setValue('identifier', `${k}@parkwise.demo`); setValue('password', 'demo1234'); }} className="neu-key min-h-11 px-3 text-sm">{l}</button>)}
              </div>
              <p className="mt-3 text-xs text-muted">Also try disabled@parkwise.demo (disabled) or five wrong passwords (rate limit). Roles: {Object.values(ROLE_LABELS).join(', ')}.</p>
            </div>
          )}
        </motion.div>
      </main>
      <ForgotModal open={forgot} onClose={() => setForgot(false)} />
    </div>
  );
}

function ForgotModal({ open, onClose }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { identifier: '' } });
  useEffect(() => { if (open) { setDone(false); setErr(null); reset(); } }, [open, reset]);
  const submit = async (v) => { setErr(null); try { await authService.forgotPassword(v.identifier); setDone(true); } catch (e) { setErr(normalizeError(e)); } };
  return (
    <Modal open={open} onClose={onClose} title="Reset password" description="We never confirm whether an account exists.">
      {done ? (
        <div className="space-y-4"><Alert tone="info">If that account exists, reset instructions have been sent. Check your messages, or ask your manager to reset it.</Alert><Button className="w-full" onClick={onClose}>Done</Button></div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <Field label="Email or phone" error={errors.identifier?.message} required>{(p) => <Input {...p} {...register('identifier')} autoComplete="username" />}</Field>
          {err && <Alert tone="danger" live>{err.message}</Alert>}
          <Button type="submit" className="w-full" loading={isSubmitting}>Send reset instructions</Button>
        </form>
      )}
    </Modal>
  );
}
