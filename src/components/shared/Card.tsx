import React from 'react';
import { clsx } from 'clsx';
import { useDashboardTheme } from '@/context/DashboardThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  const { isDark } = useDashboardTheme();

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border-[0.5px] transition-all duration-200',
        isDark
          ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE] shadow-none'
          : 'bg-surface border-border text-primary shadow-soft',
        onClick && (isDark ? 'cursor-pointer hover:border-[#52525C] hover:bg-[#27272B]' : 'cursor-pointer hover:border-[#000000] hover:shadow-soft-md hover:-translate-y-0.5'),
        className
      )}
    >
      {children}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'primary' | 'pink' | 'blue' | 'yellow' | 'green' | 'purple' | 'coral' | 'teal';
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  microVisual?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'primary',
  subtitle,
  onClick,
  className,
  microVisual,
}) => {
  const { isDark } = useDashboardTheme();

  const colorMap: Record<string, string> = {
    accent: isDark ? 'bg-[#AFC7E9]/20 text-[#AFC7E9] border-[#AFC7E9]/40' : 'bg-[#AFC7E9]/30 text-[#1E3A8A] border-[#AFC7E9]',
    blue: isDark ? 'bg-[#AFC7E9]/20 text-[#AFC7E9] border-[#AFC7E9]/40' : 'bg-[#AFC7E9]/30 text-[#1E3A8A] border-[#AFC7E9]',
    success: isDark ? 'bg-[#A9BB78]/20 text-[#A9BB78] border-[#A9BB78]/40' : 'bg-[#A9BB78]/30 text-[#2D3E16] border-[#A9BB78]',
    green: isDark ? 'bg-[#A9BB78]/20 text-[#A9BB78] border-[#A9BB78]/40' : 'bg-[#A9BB78]/30 text-[#2D3E16] border-[#A9BB78]',
    warning: isDark ? 'bg-[#F2D76B]/20 text-[#F2D76B] border-[#F2D76B]/40' : 'bg-[#F2D76B]/35 text-[#5C4405] border-[#F2D76B]',
    yellow: isDark ? 'bg-[#F2D76B]/20 text-[#F2D76B] border-[#F2D76B]/40' : 'bg-[#F2D76B]/35 text-[#5C4405] border-[#F2D76B]',
    danger: isDark ? 'bg-[#E99A88]/20 text-[#E99A88] border-[#E99A88]/40' : 'bg-[#E99A88]/35 text-[#731E1E] border-[#E99A88]',
    coral: isDark ? 'bg-[#E99A88]/20 text-[#E99A88] border-[#E99A88]/40' : 'bg-[#E99A88]/35 text-[#731E1E] border-[#E99A88]',
    pink: isDark ? 'bg-[#EFAED0]/20 text-[#EFAED0] border-[#EFAED0]/40' : 'bg-[#EFAED0]/35 text-[#6D1B3E] border-[#EFAED0]',
    purple: isDark ? 'bg-[#B9A5D8]/20 text-[#B9A5D8] border-[#B9A5D8]/40' : 'bg-[#B9A5D8]/35 text-[#4D2875] border-[#B9A5D8]',
    teal: isDark ? 'bg-[#87C9BD]/20 text-[#87C9BD] border-[#87C9BD]/40' : 'bg-[#87C9BD]/35 text-[#1D5E52] border-[#87C9BD]',
    primary: isDark ? 'bg-[#27272B] text-[#F5F3EE] border-[#393940]' : 'bg-[#EEE9DD] text-primary border-[#000000]',
  };

  return (
    <Card
      onClick={onClick}
      className={clsx(
        'p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group transition-all',
        isDark
          ? 'bg-[#1F1F22] border-[#393940] hover:border-[#4E4E57]'
          : 'border-black hover:shadow-soft-md',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={clsx(
              'text-xs font-bold uppercase tracking-wider truncate mr-2',
              isDark ? 'text-[#B5B2AD]' : 'text-secondary'
            )}
          >
            {label}
          </span>
          <div
            className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center border-[0.5px] shrink-0 transition-transform duration-200 group-hover:scale-105',
              colorMap[color] || colorMap.primary
            )}
          >
            {icon}
          </div>
        </div>

        <div
          className={clsx(
            'text-3xl font-extrabold tracking-tight leading-none mb-1.5',
            isDark ? 'text-[#F5F3EE]' : 'text-primary'
          )}
        >
          {value}
        </div>

        {(subtitle || trend) && (
          <div
            className={clsx(
              'flex items-center gap-2 text-xs font-medium',
              isDark ? 'text-[#B5B2AD]' : 'text-secondary'
            )}
          >
            {trend && <span className={clsx('font-bold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>{trend}</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>

      {microVisual && (
        <div className={clsx('mt-4 pt-3 border-t-[0.5px]', isDark ? 'border-[#393940]' : 'border-black/15')}>
          {microVisual}
        </div>
      )}
    </Card>
  );
};
