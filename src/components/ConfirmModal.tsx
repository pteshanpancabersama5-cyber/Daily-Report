import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
        };
      case 'info':
        return {
          icon: <AlertCircle className="w-6 h-6 text-sky-600" />,
          btn: 'bg-sky-600 hover:bg-sky-700 text-white',
          bg: 'bg-sky-50',
          border: 'border-sky-200',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${style.bg} ${style.border} border shrink-0`}>
              {style.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 ${style.btn} disabled:opacity-50`}
            >
              {isLoading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
