import { AlertTriangle } from 'lucide-react';

const ALLERGEN_EMOJI = {
  gluten: '🌾', wheat: '🌾',
  lactose: '🥛', dairy: '🥛',
  nuts: '🥜', peanuts: '🥜',
  soy: '🌱',
  eggs: '🥚',
  shellfish: '🦐', fish: '🐟',
  sesame: '✨'
};

export default function AllergenBadge({ name }) {
  const key = (name || '').toLowerCase();
  const icon = ALLERGEN_EMOJI[key] || '⚠️';
  return (
    <span
      className="pill bg-red-50 text-red-700 border border-red-200"
      data-testid={`allergen-${key}`}
    >
      <span aria-hidden>{icon}</span>
      {name}
    </span>
  );
}

export function WarningBadge({ text }) {
  return (
    <span className="pill bg-amber-50 text-amber-800 border border-amber-200">
      <AlertTriangle size={12}/> {text}
    </span>
  );
}