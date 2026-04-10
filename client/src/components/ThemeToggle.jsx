import { useTheme } from '../hooks/useTheme';
import { HiSun, HiMoon } from 'react-icons/hi2';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      {dark ? (
        <HiSun className="w-5 h-5 text-[var(--text-secondary)]" />
      ) : (
        <HiMoon className="w-5 h-5 text-[var(--text-secondary)]" />
      )}
    </button>
  );
}
