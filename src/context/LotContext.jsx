import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const Ctx = createContext({ lots: [], lotId: undefined, lot: undefined, setLotId: () => {} });
export const useLot = () => useContext(Ctx);

/** Active parking lot for lot-scoped calls. Only lots the server assigned to the user are offered. */
export function LotProvider({ children }) {
  const { user } = useAuth();
  const lots = useMemo(() => user?.lots ?? [], [user]);
  const [lotId, setLotId] = useState();
  useEffect(() => { if (!lots.length) setLotId(undefined); else if (!lots.some((l) => l.id === lotId)) setLotId(lots[0].id); }, [lots, lotId]);
  const value = useMemo(() => ({ lots, lotId, lot: lots.find((l) => l.id === lotId), setLotId }), [lots, lotId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
