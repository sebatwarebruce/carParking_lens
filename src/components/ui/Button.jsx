import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader } from 'lucide-react';
import { clsx } from '@/utils/format.js';

const VARIANTS = {
  primary: 'bg-accent text-on-accent font-semibold shadow-[0_6px_18px_-6px_var(--glow)] hover:brightness-110',
  secondary: 'neu-key text-ink font-medium',
  ghost: 'text-ink hover:bg-surface2 font-medium',
  danger: 'tone tone-danger font-semibold hover:brightness-110',
};
const MotionLink = motion.create(Link); // module-level: created once, never during render
const SIZES = { sm: 'h-10 px-3 text-sm', md: 'h-11 px-4 text-base', lg: 'h-14 px-6 text-lg', icon: 'size-11 p-0' };

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled, icon: Icon, children, className, type = 'button', as: _as, ...rest }) {
  const isLink = !!rest.to; // `as={Link} to=...` renders a router link styled as a button
  const Comp = isLink ? MotionLink : motion.button;
  const off = disabled || loading;
  return (
    <Comp
      type={isLink ? undefined : type}
      whileTap={off ? undefined : { scale: 0.97 }}
      disabled={isLink ? undefined : off}
      aria-disabled={off || undefined}
      aria-busy={loading || undefined}
      className={clsx('inline-flex select-none items-center justify-center gap-2 rounded-md transition-[filter,box-shadow,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50', VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {loading ? <Loader size={18} className="animate-spin" aria-hidden /> : Icon ? <Icon size={size === 'lg' ? 22 : 18} strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </Comp>
  );
}
