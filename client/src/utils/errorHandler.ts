/**
 * Global error handler utility
 * This allows non-React code (like apiFetch) to trigger error displays
 */

type ErrorHandler = (error: Error | string, title?: string) => void;

let globalErrorHandler: ErrorHandler | null = null;

export const setGlobalErrorHandler = (handler: ErrorHandler) => {
  globalErrorHandler = handler;
};

export const clearGlobalErrorHandler = () => {
  globalErrorHandler = null;
};

export const handleGlobalError = (error: Error | string, title?: string) => {
  if (globalErrorHandler) {
    globalErrorHandler(error, title);
  } else {
    // Fallback to console in case error handler is not set
    console.error('Global error (no handler set):', error);
  }
};

