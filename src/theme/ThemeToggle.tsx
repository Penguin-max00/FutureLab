import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-label="Dark mode"
      aria-checked={theme === 'dark'}
      onClick={toggleTheme}
      title={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
    >
      <span className="theme-toggle-thumb" aria-hidden="true" />
      <span
        className={theme === 'light' ? 'theme-choice chosen' : 'theme-choice'}
        aria-hidden="true"
      >
        <Sun size={15} />
        Light
      </span>
      <span
        className={theme === 'dark' ? 'theme-choice chosen' : 'theme-choice'}
        aria-hidden="true"
      >
        <Moon size={15} />
        Dark
      </span>
    </button>
  );
}
