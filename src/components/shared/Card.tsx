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
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'primary' | 'pink' | 'blue' | 'yellow' | 'green';
  subtitle?: string;
  onClick?: () => void;
  className?: string;
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
}) => {
  const colorMap = {
    accent: 'bg-[#AFC7E9]/25 text-[#2A4365] border-[#AFC7E9]/50',
    blue: 'bg-[#AFC7E9]/30 text-[#1E3A8A] border-[#AFC7E9]/60',
    success: 'bg-[#A9BB78]/25 text-[#35481B] border-[#A9BB78]/50',
    green: 'bg-[#A9BB78]/30 text-[#2D3E16] border-[#A9BB78]/60',
    warning: 'bg-[#F2D76B]/30 text-[#715407] border-[#F2D76B]/60',
    yellow: 'bg-[#F2D76B]/35 text-[#5C4405] border-[#F2D76B]/70',
    danger: 'bg-[#EFAED0]/30 text-[#782046] border-[#EFAED0]/60',
    pink: 'bg-[#EFAED0]/35 text-[#6D1B3E] border-[#EFAED0]/70',
    primary: 'bg-[#EEE9DD] text-primary border-[#E7E1D5]',
  };

  return (
    <Card
      onClick={onClick}
      className={clsx(
        'p-6 flex flex-col justify-between relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider truncate mr-2">
          {label}
        </span>
        <div
          className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-105',
            colorMap[color] || colorMap.primary
          )}
        >
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-primary tracking-tight leading-none">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-secondary font-medium">
            {trend && <span className="font-semibold text-primary">{trend}</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
