import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

export const ToastContainer: React.FC = () => {
  const { isDark } = useDashboardTheme();
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
  };

  const bgMap = {
    success: 'border-emerald-200 bg-white shadow-emerald-50 text-primary',
    error: 'border-rose-200 bg-white shadow-rose-50 text-primary',
    warning: 'border-amber-200 bg-white shadow-amber-50 text-primary',
    info: 'border-blue-200 bg-white shadow-blue-50 text-primary',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border-[0.5px] shadow-lg transition-all animate-in slide-in-from-right-5 duration-200',
            isDark
              ? 'border-[#393940] bg-[#1F1F22] text-[#F5F3EE] shadow-2xl'
              : bgMap[toast.type]
          )}
        >
          {iconMap[toast.type]}
          <div className="flex-1 min-w-0">
            <h5 className={clsx('text-xs font-semibold', isDark ? 'text-[#F5F3EE]' : 'text-primary')}>
              {toast.title}
            </h5>
            {toast.message && (
              <p className={clsx('text-[11px] mt-0.5 line-clamp-2', isDark ? 'text-[#B5B2AD]' : 'text-secondary')}>
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className={clsx(
              'p-0.5 rounded transition-colors',
              isDark ? 'text-[#85838A] hover:text-[#F5F3EE]' : 'text-gray-400 hover:text-gray-600'
            )}
            title="Dismiss"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
