// Utility to help migrate from old error/success pattern to notifications
export const createNotificationHelpers = (notificationContext: any) => {
  const { success, error: notifyError, warning, info } = notificationContext;
  
  return {
    showSuccess: (message: string, title?: string) => {
      success(title || 'Success', message);
    },
    showError: (message: string, title?: string) => {
      notifyError(title || 'Error', message);
    },
    showWarning: (message: string, title?: string) => {
      warning(title || 'Warning', message);
    },
    showInfo: (message: string, title?: string) => {
      info(title || 'Info', message);
    }
  };
};