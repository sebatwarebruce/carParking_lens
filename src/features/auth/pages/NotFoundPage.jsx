import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button.jsx';
export default function NotFoundPage() {
  return <div className="mx-auto max-w-sm space-y-3 py-16 text-center"><h1 className="font-display text-3xl">Page not found</h1><p className="text-muted">That address does not exist. Use the menu to continue.</p><Button as={Link} to="/">Go to my home</Button></div>;
}
