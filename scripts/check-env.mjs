// Fails the build if a VITE_* variable name suggests a secret (they are all public in the bundle).
import fs from 'node:fs';
const bad = /(SECRET|PRIVATE|PASSWORD|TOKEN|API_?KEY|CLIENT_SECRET)/i;
const files = ['.env', '.env.local', '.env.production', '.env.example'].filter((f) => fs.existsSync(f));
let failed = false;
for (const f of files) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*(VITE_[A-Z0-9_]+)\s*=/);
    if (m && bad.test(m[1])) { console.error(`[check-env] ${f}: ${m[1]} looks like a secret. VITE_* values are public.`); failed = true; }
  }
}
for (const k of Object.keys(process.env)) {
  if (k.startsWith('VITE_') && bad.test(k)) { console.error(`[check-env] environment variable ${k} looks like a secret.`); failed = true; }
}
if (failed) process.exit(1);
console.log('[check-env] ok');
