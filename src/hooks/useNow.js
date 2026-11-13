import { useEffect, useState } from 'react';
import { serverClock } from '@/services/clock.js';
/** Ticks using the SERVER-synced clock (display only). */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => serverClock.now());
  useEffect(() => { const t = setInterval(() => setNow(serverClock.now()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}
