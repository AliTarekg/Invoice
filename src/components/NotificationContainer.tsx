'use client';

import React, { useEffect, useState } from 'react';
import { useNotification, Notification, NotificationType } from '../contexts/NotificationContext';
import { X, CheckCircle, XCircle, AlertTriangle, Info, Bell } from 'lucide-react';

const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorClasses: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorClasses: Record<NotificationType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

const progressColorClasses: Record<NotificationType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

interface ToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function Toast({ notification, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const Icon = iconMap[notification.type];

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notification.persistent && notification.duration) {
      let startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, notification.duration! - elapsed);
        const progressPercent = (remaining / notification.duration!) * 100;
        setProgress(progressPercent);

        if (remaining > 0) {
          requestAnimationFrame(updateProgress);
        }
      };
      updateProgress();
    }
  }, [notification.duration, notification.persistent]);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(notification.id), 300);
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        mb-4 max-w-sm w-full
      `}
    >
      <div
        className={`
          border rounded-xl shadow-lg backdrop-blur-sm relative overflow-hidden
          ${colorClasses[notification.type]}
        `}
      >
        {/* Progress bar */}
        {!notification.persistent && notification.duration && (
          <div
            className={`absolute top-0 left-0 h-1 transition-all duration-100 ease-linear ${progressColorClasses[notification.type]}`}
            style={{ width: `${progress}%` }}
          />
        )}

        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`w-6 h-6 ${iconColorClasses[notification.type]}`} />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold leading-5">
                {notification.title}
              </h3>
              {notification.message && (
                <p className="mt-1 text-sm opacity-90">
                  {notification.message}
                </p>
              )}
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className={`
                      text-xs font-semibold px-3 py-1 rounded-md transition-colors duration-200
                      ${notification.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        notification.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        notification.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                        'bg-blue-600 hover:bg-blue-700 text-white'}
                    `}
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleRemove}
                className="rounded-md hover:bg-black/10 transition-colors duration-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications, removeNotification, clearAll } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-y-auto">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>

      {/* Clear All Button (when multiple notifications) */}
      {notifications.length > 1 && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={clearAll}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Clear All ({notifications.length})
          </button>
        </div>
      )}
    </>
  );
}

export default NotificationContainer;