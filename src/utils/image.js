import imageCompression from 'browser-image-compression';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_ORIGINAL_BYTES = 12 * 1024 * 1024;

/** @returns {{ok:true}|{ok:false,code:'UPLOAD_INVALID_TYPE'|'UPLOAD_TOO_LARGE'}} */
export function validateImageFile(file) {
  if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) return { ok: false, code: 'UPLOAD_INVALID_TYPE' };
  if (file.size > MAX_ORIGINAL_BYTES) return { ok: false, code: 'UPLOAD_TOO_LARGE' };
  return { ok: true };
}

/** Client-side compression is a convenience; the server validates again. */
export async function compressImage(file) {
  try {
    if (file.size < 600 * 1024) return file;
    return await imageCompression(file, { maxSizeMB: 0.6, maxWidthOrHeight: 1600, useWebWorker: true, fileType: 'image/jpeg' });
  } catch {
    return file;
  }
}
