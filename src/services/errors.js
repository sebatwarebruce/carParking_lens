import { ERROR_MESSAGES, MSG } from '@/constants/messages.js';

/**
 * kind: network | auth | forbidden | validation | conflict | notFound | rateLimited | server | upload | unknown
 */
export class AppError extends Error {
  constructor({ code, message, status, details, requestId, kind, retryable = false, retryAfterSeconds }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.kind = kind;
    this.retryable = retryable;
    this.retryAfterSeconds = retryAfterSeconds;
  }
  /** Field errors for React Hook Form: { plateNumber: 'Required' } */
  get fieldErrors() {
    return this.details?.fields || {};
  }
}

const kindFor = (status, code) => {
  if (code === 'VALIDATION_ERROR' || status === 400 || status === 422) return code === 'PRICING_UNAVAILABLE' ? 'server' : 'validation';
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 413 || status === 415) return 'upload';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'unknown';
};

/** Converts anything thrown by axios into an AppError with a SAFE user message. */
export function normalizeError(err) {
  if (err instanceof AppError) return err;
  if (err?.code === 'ERR_CANCELED') return new AppError({ code: 'CANCELED', message: 'Cancelled.', kind: 'unknown' });
  const res = err?.response;
  if (!res) {
    return new AppError({ code: 'NETWORK_ERROR', message: MSG.networkLost, kind: 'network', retryable: true });
  }
  const body = res.data?.error || {};
  const code = body.code || (res.status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN');
  return new AppError({
    code,
    message: ERROR_MESSAGES[code] || (res.status >= 500 ? ERROR_MESSAGES.INTERNAL_ERROR : MSG.genericError),
    status: res.status,
    details: body.details,
    requestId: body.requestId || res.headers?.['x-request-id'],
    kind: kindFor(res.status, code),
    retryable: res.status >= 500 || res.status === 429,
    retryAfterSeconds: body.details?.retryAfterSeconds,
  });
}
