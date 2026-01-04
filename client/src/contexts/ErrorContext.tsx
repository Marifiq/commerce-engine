'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import ErrorDisplay, { getHumanReadableError } from './ErrorDisplay';
import { setGlobalErrorHandler, clearGlobalErrorHandler } from '@/lib/utils/errorHandler';

interface ErrorContextType {
  showError: (error: Error | string, title?: string) => void;
  clearError: () => void;
  currentError: Error | string | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);

  const showError = useCallback((error: Error | string, title?: string) => {
    setError(error);
    setErrorTitle(title);
    
    // Auto-clear error after 5 seconds (quick dismissal to not distract)
    setTimeout(() => {
      setError(null);
      setErrorTitle(undefined);
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorTitle(undefined);
  }, []);

  // Register global error handler on mount
  useEffect(() => {
    setGlobalErrorHandler(showError);
    
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason || 'An unexpected error occurred'));
      showError(error, 'Unexpected Error');
      // Prevent default browser console error
      event.preventDefault();
    };
    
    // Handle global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error instanceof Error 
        ? event.error 
        : new Error(event.message || 'An unexpected error occurred');
      showError(error, 'Application Error');
      // Prevent default browser console error in production
      if (process.env.NODE_ENV === 'production') {
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      clearGlobalErrorHandler();
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showError]);

  return (
    <ErrorContext.Provider value={{ showError, clearError, currentError: error }}>
      {children}
      <ErrorDisplay
        error={error}
        onClose={clearError}
        title={errorTitle}
        type="error"
      />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Export the utility function for use in other components
export { getHumanReadableError };

