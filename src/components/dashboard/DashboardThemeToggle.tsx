import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface DashboardThemeToggleProps {
  className?: string;
}

export const DashboardThemeToggle: React.FC<DashboardThemeToggleProps> = ({ className }) => {
  const { isDark, toggleTheme } = useDashboardTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={clsx(
        'group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 select-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent border-[0.5px]',
        isDark
          ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE] hover:bg-[#303036] hover:border-[#4E4E57]'
          : 'bg-[#EEE9DD] border-black text-[#222222] hover:bg-[#E5DFD0]'
      , className)}
    >
      {/* Icon with spin/fade transition */}
      <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#AFC7E9] fill-[#AFC7E9]/30 transition-transform duration-200 rotate-0" />
        ) : (
          <Sun className="w-4 h-4 text-[#C68B1A] fill-[#F2D76B] transition-transform duration-200 rotate-0" />
        )}
      </div>

      {/* Mode Label */}
      <span className="font-bold tracking-tight">
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>

      {/* Mini Toggle Switch Indicator */}
      <div
        className={clsx(
          'w-7 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center border-[0.5px]',
          isDark
            ? 'bg-[#101010] border-[#393940] justify-end'
            : 'bg-[#DDD6C5] border-black/30 justify-start'
        )}
      >
        <div
          className={clsx(
            'w-2.5 h-2.5 rounded-full shadow-xs transition-transform duration-200',
            isDark ? 'bg-[#AFC7E9]' : 'bg-[#222222]'
          )}
        />
      </div>
    </button>
  );
};
