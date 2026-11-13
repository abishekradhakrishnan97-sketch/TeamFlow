import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface rounded-2xl border border-border shadow-soft transition-all duration-200',
        onClick && 'cursor-pointer hover:border-[#D5CDBD] hover:shadow-soft-md hover:-translate-y-0.5',
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
  const colorMap: Record<string, string> = {
    accent: 'bg-[#AFC7E9]/30 text-[#1E3A8A] border-[#AFC7E9]',
    blue: 'bg-[#AFC7E9]/30 text-[#1E3A8A] border-[#AFC7E9]',
    success: 'bg-[#A9BB78]/30 text-[#2D3E16] border-[#A9BB78]',
    green: 'bg-[#A9BB78]/30 text-[#2D3E16] border-[#A9BB78]',
    warning: 'bg-[#F2D76B]/35 text-[#5C4405] border-[#F2D76B]',
    yellow: 'bg-[#F2D76B]/35 text-[#5C4405] border-[#F2D76B]',
    danger: 'bg-[#E99A88]/35 text-[#731E1E] border-[#E99A88]',
    coral: 'bg-[#E99A88]/35 text-[#731E1E] border-[#E99A88]',
    pink: 'bg-[#EFAED0]/35 text-[#6D1B3E] border-[#EFAED0]',
    purple: 'bg-[#B9A5D8]/35 text-[#4D2875] border-[#B9A5D8]',
    teal: 'bg-[#87C9BD]/35 text-[#1D5E52] border-[#87C9BD]',
    primary: 'bg-[#EEE9DD] text-primary border-[#000000]',
  };

  return (
    <Card
      onClick={onClick}
      className={clsx(
        'p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group border-[0.5px] border-black transition-all hover:shadow-soft-md',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider truncate mr-2">
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

        <div className="text-3xl font-extrabold text-primary tracking-tight leading-none mb-1.5">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 text-xs text-secondary font-medium">
            {trend && <span className="font-bold text-primary">{trend}</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>

      {microVisual && (
        <div className="mt-4 pt-3 border-t-[0.5px] border-black/15">
          {microVisual}
        </div>
      )}
    </Card>
  );
};
