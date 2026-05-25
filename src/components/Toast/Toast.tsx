// src/components/Toast/Toast.tsx
import React, { useEffect } from 'react';
import '../../types/toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
  showIcon?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  description,
  duration = 5000,
  onClose,
  showIcon = true
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: (
      <svg className="toast-icon" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    error: (
      <svg className="toast-icon" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    warning: (
      <svg className="toast-icon" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 22h20L12 2z" fill="currentColor"/>
        <path d="M12 9v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    info: (
      <svg className="toast-icon" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M12 16v-4m0-4h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  };

  const typeClasses = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info'
  };

  return (
    <div className={`toast toast-${type} ${typeClasses[type]}`} role="alert">
      <div className="toast-content">
        {showIcon && <div className={`toast-icon-wrapper ${type}`}>{icons[type]}</div>}
        <div className="toast-body">
          <div className="toast-message">{message}</div>
          {description && <div className="toast-description">{description}</div>}
        </div>
      </div>
      <button className="toast-close" onClick={() => onClose(id)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div className={`toast-progress toast-progress-${type}`} style={{animationDuration: `${duration}ms`}}/>
    </div>
  );
};

export default Toast;