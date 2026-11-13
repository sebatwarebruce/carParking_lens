import { QRCodeSVG } from 'qrcode.react';

/** The QR encodes only the ticket lookup URL (no financial or personal secrets). Staff resolve it through authenticated search. */
export const ticketUrl = (ticketNumber) => `${window.location.origin}/s/${encodeURIComponent(ticketNumber)}`;
export default function QrTicket({ ticketNumber, size = 168 }) {
  return (
    <figure className="inline-flex flex-col items-center gap-2">
      <div className="rounded-md bg-[#F5EBD8] p-3"><QRCodeSVG value={ticketUrl(ticketNumber)} size={size} bgColor="#F5EBD8" fgColor="#101010" level="M" title={`QR code for ticket ${ticketNumber}`} /></div>
      <figcaption className="plate text-sm text-muted">{ticketNumber}</figcaption>
    </figure>
  );
}
