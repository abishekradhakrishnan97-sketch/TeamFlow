import React from 'react';
import { Button } from './Button';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  const { isDark } = useDashboardTheme();

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed transition-colors',
        isDark
          ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE]'
          : 'bg-white border-border text-primary',
        className
      )}
    >
      <div
        className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center border mb-3 transition-colors',
          isDark
            ? 'bg-[#27272B] border-[#393940] text-[#AFC7E9]'
            : 'bg-gray-50 border-border text-secondary'
        )}
      >
        {icon}
      </div>
      <h4 className={clsx('text-sm font-semibold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>
        {title}
      </h4>
      <p className={clsx('text-xs max-w-sm mt-1 mb-4', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
