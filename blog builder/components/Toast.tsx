import React from 'react';
import ReactDOM from 'react-dom';
import { ToastMessage } from '../App';
import { CheckIcon, ErrorIcon } from './icons/StatusIcons';

interface ToastProps {
  toasts: ToastMessage[];
}

const Toast: React.FC<ToastProps> = ({ toasts }) => {
  const portalRoot = document.getElementById('toast-root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed bottom-5 right-5 z-50 space-y-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-4 w-full max-w-xs p-4 text-white rounded-lg shadow-lg backdrop-blur-sm border ${
            toast.type === 'success' ? 'bg-green-500/30 border-green-500/50' : 'bg-red-500/30 border-red-500/50'
          }`}
          role="alert"
        >
          <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
            toast.type === 'success' ? 'bg-green-800' : 'bg-red-800'
          }`}>
            {toast.type === 'success' ? <CheckIcon /> : <ErrorIcon />}
            <span className="sr-only">{toast.type} icon</span>
          </div>
          <div className="ms-3 text-sm font-normal">{toast.message}</div>
        </div>
      ))}
    </div>,
    portalRoot
  );
};

export default Toast;