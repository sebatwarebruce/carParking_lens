export const uuid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `k_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
