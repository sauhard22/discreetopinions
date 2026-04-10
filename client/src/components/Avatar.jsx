const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
  'bg-pink-500', 'bg-rose-500', 'bg-sky-500', 'bg-teal-500',
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function Avatar({ name = '', size = 'md' }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const color = COLORS[hashCode(name) % COLORS.length];

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold select-none shrink-0`}>
      {initials}
    </div>
  );
}
