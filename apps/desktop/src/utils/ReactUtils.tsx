import { toast } from 'sonner';

export const showToast = (
  type: 'success' | 'error' | 'warning' | 'info' | 'message' | 'default' = 'default',
  message: string,
  title?: string,
) => {
  switch (type) {
    case 'message':
      toast.message(title, {
        description: message,
      });
      break;
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    case 'info':
      toast.info(message);
      break;
    case 'default':
      toast(message);
      break;
  }
};

/**
 * This method is used to show a toast notification for a promise.
 * @param promise The promise to be resolved
 * @param loadingMessage The message to be displayed while the promise is loading
 * @param successMessage The message to be displayed when the promise is resolved
 * @param errorMessage The message to be displayed when the promise is rejected
 */
export const showPromiseToast = (
  promise: Promise<any>,
  loadingMessage: string,
  successMessage: string,
  errorMessage: string,
) => {
  toast.promise(promise, {
    loading: loadingMessage,
    success: () => {
      return successMessage;
    },
    error: errorMessage,
  });
};
