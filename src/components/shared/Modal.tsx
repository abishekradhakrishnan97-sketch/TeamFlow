import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useDashboardTheme } from '@/context/DashboardThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
}) => {
  const { isDark } = useDashboardTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 transition-opacity backdrop-blur-sm',
          isDark ? 'bg-black/75' : 'bg-primary/40'
        )}
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={clsx(
          'relative w-full rounded-2xl border-[0.5px] shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150 transition-colors',
          isDark
            ? 'bg-[#1F1F22] border-[#393940] text-[#F5F3EE]'
            : 'bg-white border-border text-primary',
          sizes[size]
        )}
      >
        {/* Header */}
        <div
          className={clsx(
            'flex items-start justify-between px-6 py-4 border-b-[0.5px]',
            isDark ? 'border-b-[#393940]' : 'border-b-border'
          )}
        >
          <div>
            <h3 className={clsx('text-lg font-bold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>
              {title}
            </h3>
            {subtitle && (
              <p className={clsx('text-xs mt-0.5', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-1.5 rounded-lg transition-colors border-[0.5px]',
              isDark
                ? 'text-[#B5B2AD] hover:text-[#F5F3EE] hover:bg-[#27272B] border-[#393940]'
                : 'text-secondary hover:text-primary hover:bg-gray-100 border-transparent'
            )}
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={clsx(
              'flex items-center justify-end gap-3 px-6 py-3.5 border-t-[0.5px] rounded-b-2xl',
              isDark ? 'bg-[#27272B] border-t-[#393940]' : 'bg-gray-50 border-t-border'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

