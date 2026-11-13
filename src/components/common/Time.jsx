import { formatDateTime, formatTime } from '@/utils/format.js';
import { useNow } from '@/hooks/useNow.js';
import { formatElapsed } from '@/utils/format.js';

export const Timestamp = ({ iso, short }) => (iso ? <time dateTime={iso} className="tabular">{short ? formatTime(iso) : formatDateTime(iso)}</time> : <span>-</span>);

/** Elapsed time since the SERVER entry time, ticking with the server-synced clock (display only). */
export function ElapsedTimer({ entryTime, className }) {
  const now = useNow(30000);
  return <span className={`tabular ${className || ''}`} aria-label="Time parked">{formatElapsed(now - Date.parse(entryTime))}</span>;
}
