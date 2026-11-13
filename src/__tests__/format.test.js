import { describe, it, expect } from 'vitest';
import { formatMoney, formatDuration, maskPhone, cleanPlateInput } from '@/utils/format.js';
import { toCsv } from '@/utils/csv.js';

describe('formatting', () => {
  it('formats integer RWF', () => { expect(formatMoney(2500)).toBe('2,500 RWF'); expect(formatMoney(0)).toBe('0 RWF'); });
  it('formats durations for display only', () => { expect(formatDuration(45)).toBe('45 min'); expect(formatDuration(120)).toBe('2 h'); expect(formatDuration(270)).toBe('4 h 30 min'); });
  it('masks phone numbers', () => { expect(maskPhone('0781234567')).toBe('078****567'); expect(maskPhone(undefined)).toBe('-'); });
  it('uppercases plates while typing and strips junk', () => { expect(cleanPlateInput('rad 123 a!')).toBe('RAD 123 A'); });
  it('neutralises spreadsheet formula injection in CSV', () => { expect(toCsv([{ label: 'x', value: 'v' }], [{ v: '=HYPERLINK("x")' }])).toContain("'=HYPERLINK"); });
});
