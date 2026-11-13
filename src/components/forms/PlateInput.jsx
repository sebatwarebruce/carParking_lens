import { forwardRef } from 'react';
import { Input } from './Field.jsx';
import { cleanPlateInput } from '@/utils/format.js';
/** Uppercase display while typing; the value sent to the server is exactly what the attendant entered (trimmed). */
const PlateInput = forwardRef(function PlateInput({ onChange, ...p }, ref) {
  return <Input ref={ref} {...p} onChange={(e) => { e.target.value = cleanPlateInput(e.target.value); onChange?.(e); }} className="plate !h-14 text-center text-2xl tracking-widest" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={14} placeholder="e.g. RAD 123 A" />;
});
export default PlateInput;
