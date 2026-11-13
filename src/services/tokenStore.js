// Access token lives in memory only (never localStorage/sessionStorage). Refresh is an httpOnly cookie on the backend.
let accessToken = null;
let onExpired = () => {};
export const tokenStore = {
  get: () => accessToken,
  set: (t) => { accessToken = t; },
  clear: () => { accessToken = null; },
  setExpiredHandler: (fn) => { onExpired = fn; },
  notifyExpired: () => onExpired(),
};
