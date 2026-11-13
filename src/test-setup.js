import '@testing-library/jest-dom/vitest';
// jsdom has no object-URL support.
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:mock';
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
// jsdom lacks <dialog> modal methods (all supported browsers have them).
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ||= function showModal() { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close ||= function close() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
}
