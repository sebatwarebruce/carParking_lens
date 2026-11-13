// Server clock offset so live timers never trust the device clock (Blueprint 8.2: client clock is display-only).
let offsetMs = 0;
export const serverClock = {
  sync(serverIso) { const t = Date.parse(serverIso); if (!Number.isNaN(t)) offsetMs = t - Date.now(); },
  now: () => Date.now() + offsetMs,
  offset: () => offsetMs,
};
