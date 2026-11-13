import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageOff, Maximize2 } from 'lucide-react';
import { uploadService } from '@/services/uploadService.js';
import Modal from '@/components/ui/Modal.jsx';
import { clsx, formatDateTime } from '@/utils/format.js';

/** Loads a vehicle photo through the authenticated API client. No public URL is rendered and there is no download action. */
export default function SecurePhoto({ photo, alt, className, label }) {
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['photo', photo?.key], queryFn: () => uploadService.fetchPhotoBlob(photo.url), enabled: !!photo?.url, staleTime: Infinity, gcTime: 5 * 60_000 });
  const [src, setSrc] = useState(null);
  useEffect(() => { if (!q.data) return; const u = URL.createObjectURL(q.data); setSrc(u); return () => URL.revokeObjectURL(u); }, [q.data]);
  if (!photo) return <div className={clsx('grid place-items-center rounded-md border border-dashed border-line text-sm text-muted', className)}>No photo</div>;
  if (q.isError) return <div role="img" aria-label={`${alt} unavailable`} className={clsx('grid place-items-center gap-1 rounded-md border border-line bg-surface2 p-3 text-center text-xs text-muted', className)}><ImageOff size={20} aria-hidden />Photo unavailable</div>;
  if (!src) return <div className={clsx('skeleton', className)} aria-label="Loading photo" />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={clsx('group relative block overflow-hidden rounded-md border border-line', className)} aria-label={`View larger: ${alt}`}>
        <img src={src} alt={alt} className="size-full object-cover" draggable={false} />
        <span className="absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white"><Maximize2 size={14} aria-hidden /></span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={label || alt} description={photo.capturedAt ? `Captured ${formatDateTime(photo.capturedAt)}` : undefined} variant="sheet">
        <img src={src} alt={alt} className="max-h-[70dvh] w-full rounded-md object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
      </Modal>
    </>
  );
}
