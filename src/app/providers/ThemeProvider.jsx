import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const Ctx = createContext({ theme: 'dark', toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'cream' ? 'cream' : 'dark'));
  useEffect(() => {
    if (theme === 'cream') document.documentElement.dataset.theme = 'cream'; else delete document.documentElement.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'cream' ? '#F5EBD8' : '#101010');
    try { localStorage.setItem('pw-theme', theme); } catch { /* preference only */ }
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'cream' : 'dark')), []);
  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}
