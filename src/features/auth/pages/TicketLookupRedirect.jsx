import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
// QR codes encode /s/<ticket>. Signed-in staff are sent to exit lookup with the ticket prefilled (authenticated search resolves it).
export default function TicketLookupRedirect() {
  const { ticket } = useParams();
  const { can } = useAuth();
  return <Navigate to={can('sessions.checkout') ? `/exit?q=${encodeURIComponent(ticket)}` : `/history?q=${encodeURIComponent(ticket)}`} replace />;
}
