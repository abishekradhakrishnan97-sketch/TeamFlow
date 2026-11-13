import React from 'react';
import { Button } from './Button';

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
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-border ${
        className || ''
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-secondary border border-border mb-3">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-primary">{title}</h4>
      <p className="text-xs text-secondary max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

