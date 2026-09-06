import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Sparkles, XCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'sloth_trap' | 'phantom_default' | 'error' | 'info';
  message: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let style = 'border-[#22242a] bg-[#131418] text-[#f0f2f5]';
          let iconColor = 'text-[#8a8f98]';
          let Icon = Sparkles;

          if (toast.type === 'success') {
            style = 'border-[#00ff95]/40 bg-[#131418] text-[#f0f2f5] shadow-[0_8px_24px_rgba(0,255,149,0.15)]';
            iconColor = 'text-[#00ff95]';
            Icon = CheckCircle;
          } else if (toast.type === 'sloth_trap') {
            style = 'border-[#ffb800]/50 bg-[#131418] text-[#f0f2f5] shadow-[0_8px_24px_rgba(255,184,0,0.15)]';
            iconColor = 'text-[#ffb800]';
            Icon = AlertTriangle;
          } else if (toast.type === 'phantom_default' || toast.type === 'error') {
            style = 'border-[#ff3b5c]/60 bg-[#131418] text-[#f0f2f5] shadow-[0_8px_24px_rgba(255,59,92,0.2)]';
            iconColor = 'text-[#ff3b5c]';
            Icon = XCircle;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              onClick={() => onDismiss(toast.id)}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-snug backdrop-blur-md cursor-pointer transition ${style}`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 font-medium">{toast.message}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
