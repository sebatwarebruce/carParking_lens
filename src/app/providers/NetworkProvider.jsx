import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext({ online: true });
export const useNetwork = () => useContext(Ctx);

export default function NetworkProvider({ children }) {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return <Ctx.Provider value={{ online }}>{children}</Ctx.Provider>;
}
