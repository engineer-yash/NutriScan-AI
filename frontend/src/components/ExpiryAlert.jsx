import { AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';

/**
 * Coloured banner that surfaces OCR-detected expiry info.
 *
 *   ≤ 0 days  → red     \"Expired\"
 *   ≤ 3 days  → red     \"Expires in N days\"
 *   ≤ 7 days  → orange  \"Expires in N days\"
 *   else      → green   \"Safe — expires in N days\"
 *
 * Renders nothing when no expiry was detected.
 */
export default function ExpiryAlert({ detected, expiryDate, daysRemaining, compact = false }) {
  if (!detected || daysRemaining === null || daysRemaining === undefined) return null;

  const date = expiryDate ? new Date(expiryDate) : null;
  const dateLabel = date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  let tone, Icon, title;
  if (daysRemaining < 0) {
    tone = 'bg-red-50 text-red-800 border-red-200';
    Icon = AlertTriangle;
    title = `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago`;
  } else if (daysRemaining <= 3) {
    tone = 'bg-red-50 text-red-800 border-red-200';
    Icon = AlertTriangle;
    title = daysRemaining === 0 ? 'Expires today' : `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
  } else if (daysRemaining <= 7) {
    tone = 'bg-amber-50 text-amber-800 border-amber-200';
    Icon = CalendarClock;
    title = `Expires in ${daysRemaining} days`;
  } else {
    tone = 'bg-leaf-50 text-leaf-800 border-leaf-200';
    Icon = CheckCircle2;
    title = `Safe — expires in ${daysRemaining} days`;
  }

  if (compact) {
    return (
      <span
        className={`pill border ${tone}`}
        data-testid="expiry-pill"
        title={`Best before ${dateLabel}`}
      >
        <Icon size={12}/> {title}
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${tone}`}
      data-testid="expiry-alert"
    >
      <Icon size={18} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm sm:text-base">{title}</p>
        <p className="text-xs opacity-80">Best before {dateLabel}</p>
      </div>
    </div>
  );
}