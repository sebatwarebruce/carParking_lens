import { useEffect, useRef, useState } from 'react';
import Alert from '@/components/feedback/Alert.jsx';
import { MSG } from '@/constants/messages.js';

/** Camera QR scanner. The library is lazy-loaded only when the scanner opens. */
export default function QrScanner({ onResult }) {
  const ref = useRef(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let scanner; let stopped = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) { setErr('unavailable'); return; }
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-region');
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => { if (!stopped) { stopped = true; onResult(text); } }, () => {});
      } catch (e) { setErr(/denied|permission/i.test(String(e)) ? 'denied' : 'unavailable'); }
    })();
    return () => { stopped = true; try { scanner?.isScanning && scanner.stop().then(() => scanner.clear()); } catch { /* ignore */ } };
  }, [onResult]);
  return (
    <div className="space-y-3">
      {err ? <Alert tone="warning" live>{err === 'denied' ? MSG.cameraDenied : 'The scanner could not start here. Type the ticket number or plate instead.'}</Alert>
        : <><div id="qr-region" ref={ref} className="overflow-hidden rounded-lg border border-line" /><p className="text-center text-sm text-muted">Point the camera at the ticket QR code.</p></>}
    </div>
  );
}
