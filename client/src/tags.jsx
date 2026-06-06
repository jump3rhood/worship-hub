export const SONG_TAGS = [
  {
    value: 'soundcheck',
    label: 'Soundcheck',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    pill: 'border-amber-600 text-amber-300 hover:bg-amber-900/40',
    pillActive: 'bg-amber-600 text-white border-amber-600',
  },
  {
    value: 'offertory',
    label: 'Offertory',
    badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    pill: 'border-emerald-600 text-emerald-300 hover:bg-emerald-900/40',
    pillActive: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    value: 'communion',
    label: 'Communion',
    badge: 'bg-sky-900/60 text-sky-300 border-sky-700/50',
    pill: 'border-sky-600 text-sky-300 hover:bg-sky-900/40',
    pillActive: 'bg-sky-600 text-white border-sky-600',
  },
];

export function TagBadge({ tag }) {
  const t = SONG_TAGS.find((t) => t.value === tag);
  if (!t) return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${t.badge}`}>
      {t.label}
    </span>
  );
}
