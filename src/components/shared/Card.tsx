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
        'bg-white rounded-xl border border-border shadow-sm transition-all',
        onClick && 'cursor-pointer hover:border-gray-300 hover:shadow-md',
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
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'primary';
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'primary',
  subtitle,
  onClick,
}) => {
  const colorMap = {
    accent: 'bg-indigo-50 text-accent border-indigo-100',
    success: 'bg-emerald-50 text-success border-emerald-100',
    warning: 'bg-amber-50 text-warning border-amber-100',
    danger: 'bg-rose-50 text-danger border-rose-100',
    primary: 'bg-gray-50 text-primary border-gray-100',
  };

  return (
    <Card
      onClick={onClick}
      className="p-5 flex flex-col justify-between relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          {label}
        </span>
        <div
          className={clsx(
            'w-9 h-9 rounded-lg flex items-center justify-center border',
            colorMap[color]
          )}
        >
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-primary tracking-tight">{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-secondary">
            {trend && <span className="font-medium text-primary">{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};

