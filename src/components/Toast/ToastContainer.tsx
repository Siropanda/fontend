// src/components/Toast/ToastContainer.tsx
import React from 'react';
import Toast, { ToastType } from './Toast';
import '../../types/toast.css';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  removeToast,
  position = 'top-right'
}) => {
  const positionClasses = {
    'top-right': 'toast-top-right',
    'top-left': 'toast-top-left',
    'top-center': 'toast-top-center',
    'bottom-right': 'toast-bottom-right',
    'bottom-left': 'toast-bottom-left',
    'bottom-center': 'toast-bottom-center'
  };

  return (
    <div className={`toast-container ${positionClasses[position]}`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          description={toast.description}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;