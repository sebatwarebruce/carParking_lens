import { formatDateTime, formatDuration, formatMoney } from './format.js';
import { methodLabel } from '@/constants/paymentMethods.js';

/** Receipt PDF built ONLY from the server's Receipt record (jsPDF is lazy-loaded). */
export async function downloadReceiptPdf(r) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: [80, 190] });
  let y = 10;
  const center = (t, size = 10, bold = false) => { doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.text(String(t), 40, y, { align: 'center' }); y += size * 0.5 + 2; };
  const row = (a, b, bold = false) => { doc.setFontSize(9); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.text(String(a), 6, y); doc.text(String(b), 74, y, { align: 'right' }); y += 5; };
  center(r.organizationName, 12, true); center(r.lotName, 9); y += 2;
  center('PARKING RECEIPT', 10, true); center(r.receiptNumber, 9); y += 2;
  doc.line(6, y, 74, y); y += 5;
  row('Ticket', r.ticketNumber); row('Plate', r.vehicle.plateNumber); row('Space', r.slotNumber);
  row('Entry', formatDateTime(r.entryTime)); row('Exit', formatDateTime(r.exitTime)); row('Duration', formatDuration(r.durationMinutes));
  y += 1; doc.line(6, y, 74, y); y += 5;
  r.breakdown.forEach((b) => row(b.label, formatMoney(b.amount, r.currency)));
  doc.line(6, y, 74, y); y += 5;
  row('TOTAL PAID', formatMoney(r.total, r.currency), true);
  row('Method', methodLabel(r.payment.method)); row('Reference', r.payment.transactionReference.slice(-18)); row('Paid at', formatDateTime(r.payment.paidAt));
  y += 4; center('Thank you for parking with us.', 8);
  doc.save(`${r.receiptNumber}.pdf`);
}
