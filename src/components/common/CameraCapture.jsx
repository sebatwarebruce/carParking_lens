import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Aperture, Camera, ImagePlus, RotateCcw, Upload, BadgeCheck, Smartphone } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { uploadService } from '@/services/uploadService.js';
import { normalizeError } from '@/services/errors.js';
import { compressImage, validateImageFile } from '@/utils/image.js';
import { ERROR_MESSAGES, MSG } from '@/constants/messages.js';
import { useNetwork } from '@/app/providers/NetworkProvider.jsx';
import { formatDateTime } from '@/utils/format.js';

/**
 * Photo capture with explicit states (UX 7.5):
 *   idle -> live viewfinder | file picker -> captured (on this device only) -> uploading n% -> uploaded (server ref)
 * Errors: permission denied, camera unavailable, invalid/oversized file, upload failed / network lost.
 * `value` = { file, previewUrl, capturedAt, ref? } is owned by the parent so retaking never resets the form.
 * "Captured on this device" and "Uploaded" are separate states: only `value.ref` (server PhotoRef) means saved.
 */
export default function CameraCapture({ value, onChange, captureType, lotId, instruction = 'Capture the vehicle and plate clearly.', disabled }) {
  const { online } = useNetwork();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const abortRef = useRef(null);
  const [mode, setMode] = useState('idle'); // idle | requesting | live
  const [camError, setCamError] = useState(null); // 'denied' | 'unavailable' | code
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [flash, setFlash] = useState(false);

  const stopStream = useCallback(() => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; }, []);
  useEffect(() => () => { stopStream(); abortRef.current?.abort(); }, [stopStream]);

  const setFile = (file) => {
    const v = validateImageFile(file);
    if (!v.ok) { setCamError(v.code); return; }
    setCamError(null); setUploadError(null);
    onChange({ file, previewUrl: URL.createObjectURL(file), capturedAt: new Date().toISOString(), ref: null });
  };

  const openCamera = async () => {
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia || (typeof window !== 'undefined' && !window.isSecureContext)) { setCamError('unavailable'); return; }
    setMode('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false });
      streamRef.current = stream; setMode('live');
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play?.(); } });
    } catch (e) {
      setMode('idle'); setCamError(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'denied' : 'unavailable');
    }
  };
  const closeCamera = () => { stopStream(); setMode('idle'); };
  const shoot = () => {
    const v = videoRef.current; if (!v?.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    setFlash(true); setTimeout(() => setFlash(false), 160);
    c.toBlob((blob) => { if (!blob) return; closeCamera(); setFile(new File([blob], `vehicle-${captureType.toLowerCase()}.jpg`, { type: 'image/jpeg' })); }, 'image/jpeg', 0.88);
  };

  const upload = async () => {
    if (!value?.file) return;
    setUploadError(null); setUploading(true); setProgress(0);
    abortRef.current = new AbortController();
    try {
      const small = await compressImage(value.file);
      const ref = await uploadService.uploadVehiclePhoto({ file: small, captureType, lotId, onProgress: setProgress, signal: abortRef.current.signal });
      onChange({ ...value, ref });
    } catch (e) {
      const err = normalizeError(e);
      if (err.code !== 'CANCELED') setUploadError(err);
    } finally { setUploading(false); }
  };
  const retake = () => { abortRef.current?.abort(); if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl); onChange(null); setUploadError(null); setCamError(null); setProgress(0); };

  const pickFile = (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ''; }} />
      <Button variant="secondary" size="lg" icon={ImagePlus} disabled={disabled} onClick={() => fileRef.current?.click()}>Choose or take photo</Button>
    </>
  );

  // ----- captured / uploading / uploaded / failed -----
  if (value?.previewUrl) {
    const saved = !!value.ref;
    return (
      <div className="space-y-3" data-testid="photo-preview">
        <div className="relative overflow-hidden rounded-lg border border-line">
          <img src={value.previewUrl} alt="Captured vehicle preview" className="aspect-[4/3] w-full object-cover" />
          <div className="absolute left-2 top-2">
            {saved ? <span className="tone tone-success inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold"><BadgeCheck size={14} aria-hidden />Uploaded</span>
              : <span className="tone tone-warning inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold"><Smartphone size={14} aria-hidden />Captured on this device only</span>}
          </div>
          <p className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-0.5 text-xs text-white">{formatDateTime(value.capturedAt)}</p>
        </div>
        {uploading && (
          <div role="status" aria-live="polite" className="space-y-2">
            <p className="text-sm font-medium">{MSG.photoUploading}</p>
            <div className="h-2 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><motion.div className="h-full bg-accent" animate={{ width: `${progress}%` }} /></div>
            <p className="tabular text-xs text-muted">{progress}%</p>
          </div>
        )}
        {uploadError && <Alert tone="danger" live title={uploadError.kind === 'network' ? 'Photo not uploaded' : 'Upload failed'}>{uploadError.kind === 'network' ? MSG.networkLost : (ERROR_MESSAGES[uploadError.code] || uploadError.message)} Your photo is still on this device.</Alert>}
        {!online && !saved && <Alert tone="warning">You are offline. Reconnect to upload this photo.</Alert>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={retake} disabled={uploading}>Retake</Button>
          {saved ? <Button variant="ghost" disabled aria-label="Photo saved">Photo saved</Button>
            : <Button icon={Upload} loading={uploading} disabled={!online} onClick={upload}>{uploadError ? 'Retry upload' : 'Use this photo'}</Button>}
        </div>
      </div>
    );
  }

  // ----- live viewfinder -----
  if (mode === 'live' || mode === 'requesting') {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-lg border border-line bg-black">
          <video ref={videoRef} playsInline muted autoPlay className="aspect-[3/4] w-full object-cover sm:aspect-video" aria-label="Camera viewfinder" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="lens-ring size-44 opacity-70 sm:size-56" /></div>
          <p className="absolute inset-x-0 top-3 text-center text-sm text-white drop-shadow">{mode === 'requesting' ? 'Waiting for camera permission...' : instruction}</p>
          <AnimatePresence>{flash && <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />}</AnimatePresence>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Button variant="ghost" onClick={closeCamera}>Cancel</Button>
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={shoot} disabled={mode !== 'live'} aria-label="Take photo" className="lens-ring grid size-[72px] place-items-center bg-accent text-on-accent disabled:opacity-50"><Aperture size={30} aria-hidden /></motion.button>
          <span />
        </div>
      </div>
    );
  }

  // ----- idle -----
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{instruction}</p>
      {camError === 'denied' && <Alert tone="warning" live>{MSG.cameraDenied}</Alert>}
      {camError === 'unavailable' && <Alert tone="info" live>{MSG.cameraUnavailable}</Alert>}
      {(camError === 'UPLOAD_TOO_LARGE' || camError === 'UPLOAD_INVALID_TYPE') && <Alert tone="danger" live>{ERROR_MESSAGES[camError]}</Alert>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" icon={Camera} disabled={disabled} onClick={openCamera}>Open camera</Button>
        {pickFile}
      </div>
    </div>
  );
}
