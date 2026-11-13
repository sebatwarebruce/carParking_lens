// MOCK SERVER ONLY. The real pricing engine lives in the backend (PricingService). The UI never imports this file.
function block(rule, minutes) {
  const lines = [];
  if (minutes <= rule.gracePeriodMinutes) {
    return { total: 0, lines: [{ code: 'GRACE', label: 'Grace period', detail: `Up to ${rule.gracePeriodMinutes} min is free`, amount: 0 }], gracePeriodApplied: true };
  }
  let total = rule.firstBlockPrice;
  lines.push({ code: 'FIRST_BLOCK', label: 'First period', detail: `First ${rule.firstBlockMinutes} min`, amount: rule.firstBlockPrice });
  const remaining = minutes - rule.firstBlockMinutes;
  if (remaining > 0) {
    const units = Math.ceil(remaining / rule.additionalBlockMinutes);
    const amount = units * rule.additionalBlockPrice;
    total += amount;
    lines.push({ code: 'ADDITIONAL', label: 'Additional time', detail: `${units} x ${rule.additionalBlockMinutes} min at ${rule.additionalBlockPrice} RWF`, amount });
  }
  return { total, lines, gracePeriodApplied: false };
}

export function priceSession(rule, durationMinutes) {
  const days = Math.floor(durationMinutes / 1440);
  const rem = durationMinutes - days * 1440;
  let breakdown = [];
  let total = 0;
  let dailyMaxApplied = false;
  if (days > 0 && rule.dailyMaxPrice) {
    breakdown.push({ code: 'FULL_DAYS', label: 'Full days', detail: `${days} x daily maximum`, amount: days * rule.dailyMaxPrice });
    total += days * rule.dailyMaxPrice;
    dailyMaxApplied = true;
  }
  const part = days > 0 && rule.dailyMaxPrice ? (rem > 0 ? block({ ...rule, gracePeriodMinutes: 0 }, rem) : { total: 0, lines: [] }) : block(rule, durationMinutes);
  const gracePeriodApplied = part.gracePeriodApplied;
  let partTotal = part.total;
  if (rule.dailyMaxPrice && partTotal > rule.dailyMaxPrice) {
    breakdown.push(...part.lines);
    breakdown.push({ code: 'DAILY_MAX', label: 'Daily maximum applied', detail: `Capped at ${rule.dailyMaxPrice} RWF`, amount: rule.dailyMaxPrice - partTotal });
    partTotal = rule.dailyMaxPrice;
    dailyMaxApplied = true;
  } else {
    breakdown.push(...part.lines);
  }
  total += partTotal;
  return { total, breakdown, gracePeriodApplied, dailyMaxApplied };
}
