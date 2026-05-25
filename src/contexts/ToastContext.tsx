// src/contexts/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ToastContainer, { ToastItem } from '../components/Toast/ToastContainer';
import { ToastType } from '../components/Toast/Toast';

interface ToastContextType {
  showToast: (type: ToastType, message: string, description?: string, duration?: number) => void;
  success: (message: string, description?: string, duration?: number) => void;
  error: (message: string, description?: string, duration?: number) => void;
  warning: (message: string, description?: string, duration?: number) => void;
  info: (message: string, description?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((
    type: ToastType, 
    message: string, 
    description?: string, 
    duration: number = 5000
  ) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type, message, description, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((message: string, description?: string, duration?: number) => {
    showToast('success', message, description, duration);
  }, [showToast]);

  const error = useCallback((message: string, description?: string, duration?: number) => {
    showToast('error', message, description, duration);
  }, [showToast]);

  const warning = useCallback((message: string, description?: string, duration?: number) => {
    showToast('warning', message, description, duration);
  }, [showToast]);

  const info = useCallback((message: string, description?: string, duration?: number) => {
    showToast('info', message, description, duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} position="top-right" />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};