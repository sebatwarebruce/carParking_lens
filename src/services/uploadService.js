import { api } from './api.js';
import { EP } from './endpoints.js';

export const uploadService = {
  /** Multipart upload with real progress. Returns the server's PhotoRef; only this reference is sent with the entry/checkout. */
  async uploadVehiclePhoto({ file, captureType, lotId, onProgress, signal }) {
    const form = new FormData();
    form.append('file', file, file.name || 'photo.jpg');
    form.append('captureType', captureType);
    if (lotId) form.append('lotId', lotId);
    const { data } = await api.post(EP.uploads.vehiclePhoto, form, {
      signal,
      timeout: 60000,
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    });
    return data;
  },
  /** Photos are fetched through the authenticated client (no public URLs, no download action). */
  async fetchPhotoBlob(url) {
    const { data } = await api.get(url, { responseType: 'blob', baseURL: '' });
    return data;
  },
};
