import { useState, useEffect, createContext, useContext } from 'react';
import './NotificationSystem.css';

// Create context for notifications
const NotificationContext = createContext();

// Hook to use notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Notification component
const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.autoClose !== false) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  return (
    <div className={`notification notification-${notification.type}`}>
      <div className="notification-content">
        {notification.icon && <span className="notification-icon">{notification.icon}</span>}
        <div className="notification-message">
          {notification.title && <div className="notification-title">{notification.title}</div>}
          <div className="notification-text">{notification.message}</div>
        </div>
        <button className="notification-close" onClick={() => onClose(notification.id)}>
          ×
        </button>
      </div>
    </div>
  );
};

// Confirmation Dialog component
const ConfirmationDialog = ({ isOpen, onConfirm, onCancel, title, message, confirmText, cancelText, type }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className={`confirmation-dialog confirmation-${type || 'default'}`}>
        <div className="confirmation-header">
          <h3>{title}</h3>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-actions">
          <button className="confirmation-cancel" onClick={onCancel}>
            {cancelText || 'Cancel'}
          </button>
          <button className={`confirmation-confirm confirmation-confirm-${type || 'default'}`} onClick={onConfirm}>
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main NotificationProvider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    type: 'default'
  });

  // Show notification
  const showNotification = (options) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: options.type || 'info', // success, error, warning, info
      message: options.message,
      title: options.title,
      icon: options.icon,
      duration: options.duration || 3000,
      autoClose: options.autoClose !== false
    };

    setNotifications(prev => [...prev, notification]);
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Show confirmation dialog
  const showConfirmation = (options) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'default', // default, danger, warning
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  // Helper methods for different notification types
  const success = (message, title) => showNotification({ type: 'success', message, title, icon: '✅' });
  const error = (message, title) => showNotification({ type: 'error', message, title, icon: '❌' });
  const warning = (message, title) => showNotification({ type: 'warning', message, title, icon: '⚠️' });
  const info = (message, title) => showNotification({ type: 'info', message, title, icon: 'ℹ️' });

  const value = {
    showNotification,
    showConfirmation,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notifications-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
      <ConfirmationDialog {...confirmDialog} />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;