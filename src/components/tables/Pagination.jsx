import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
export default function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted tabular">Page {page} of {pages} ({total} records)</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={18} /></Button>
        <Button variant="secondary" size="icon" aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={18} /></Button>
      </div>
    </nav>
  );
}
