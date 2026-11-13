import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { isDark } = useDashboardTheme();

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="flex items-start gap-3.5">
        <div
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-[0.5px]',
            isDark
              ? 'bg-[#E99A88]/20 text-[#E99A88] border-[#E99A88]/40'
              : 'bg-rose-50 text-rose-600 border-rose-100'
          )}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className={clsx('text-sm leading-relaxed', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
            {message}
          </p>
        </div>
      </div>
      <div
        className={clsx(
          'flex items-center justify-end gap-2.5 mt-6 pt-4 border-t-[0.5px]',
          isDark ? 'border-t-[#393940]' : 'border-t-border'
        )}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={loading}
          className={clsx(
            'border-[0.5px]',
            isDark ? 'bg-[#27272B] hover:bg-[#303036] text-[#F5F3EE] border-[#393940]' : ''
          )}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
