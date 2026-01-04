'use client';

import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export interface ErrorDisplayProps {
  error: Error | string | null;
  onClose?: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  showCloseButton?: boolean;
}

/**
 * Extracts clean, human-readable text from error messages
 * Removes all technical details, stack traces, and code references
 */
export const getHumanReadableError = (error: Error | string | null): string => {
  if (!error) return 'Something went wrong. Please try again.';
  
  let errorMessage = typeof error === 'string' ? error : error.message;
  
  // Remove common technical prefixes
  errorMessage = errorMessage
    .replace(/^Error:\s*/i, '')
    .replace(/^TypeError:\s*/i, '')
    .replace(/^ReferenceError:\s*/i, '')
    .replace(/^SyntaxError:\s*/i, '')
    .replace(/^NetworkError:\s*/i, '')
    .replace(/^API\s+Error\s*\[.*?\]:\s*/i, '')
    .trim();
  
  // Remove stack traces and file paths
  errorMessage = errorMessage.split('\n')[0].split('at ')[0].trim();
  
  // Remove URLs and paths
  errorMessage = errorMessage.replace(/https?:\/\/[^\s]+/g, '');
  errorMessage = errorMessage.replace(/\/[^\s]+/g, '');
  
  // Remove error codes and status codes
  errorMessage = errorMessage.replace(/\b\d{3}\b/g, '');
  errorMessage = errorMessage.replace(/\bP\d{4}\b/g, '');
  
  // Network errors
  if (errorMessage.toLowerCase().includes('fetch') || 
      errorMessage.toLowerCase().includes('network') || 
      errorMessage.toLowerCase().includes('failed to fetch') ||
      errorMessage.toLowerCase().includes('networkerror')) {
    return 'Unable to connect. Please check your internet connection.';
  }
  
  // Authentication errors
  if (errorMessage.toLowerCase().includes('token') || 
      errorMessage.toLowerCase().includes('unauthorized') || 
      errorMessage.toLowerCase().includes('authentication') ||
      errorMessage.toLowerCase().includes('login')) {
    return 'Your session expired. Please log in again.';
  }
  
  if (errorMessage.toLowerCase().includes('invalid token') || 
      errorMessage.toLowerCase().includes('expired')) {
    return 'Your session expired. Please log in again.';
  }
  
  // Permission errors
  if (errorMessage.toLowerCase().includes('forbidden') || 
      errorMessage.toLowerCase().includes('permission') ||
      errorMessage.toLowerCase().includes('access denied')) {
    return 'You do not have permission for this action.';
  }
  
  // Not found errors
  if (errorMessage.toLowerCase().includes('not found') || 
      errorMessage.toLowerCase().includes('does not exist')) {
    return 'The item you are looking for was not found.';
  }
  
  // Validation errors
  if (errorMessage.toLowerCase().includes('validation') || 
      errorMessage.toLowerCase().includes('invalid input') ||
      errorMessage.toLowerCase().includes('required')) {
    return 'Please check your input and try again.';
  }
  
  // Duplicate errors
  if (errorMessage.toLowerCase().includes('duplicate') || 
      errorMessage.toLowerCase().includes('already exists') ||
      errorMessage.toLowerCase().includes('unique constraint')) {
    return 'This item already exists. Please use a different value.';
  }
  
  // Server errors
  if (errorMessage.toLowerCase().includes('server error') || 
      errorMessage.toLowerCase().includes('internal error') ||
      errorMessage.toLowerCase().includes('database')) {
    return 'A server error occurred. Please try again later.';
  }
  
  // If message is too long or contains technical details, use generic message
  if (errorMessage.length > 150 || 
      errorMessage.includes('at ') || 
      errorMessage.includes('Error:') ||
      errorMessage.includes('TypeError') ||
      errorMessage.includes('ReferenceError') ||
      errorMessage.match(/\[.*\]/)) {
    return 'Something went wrong. Please try again.';
  }
  
  // Clean up any remaining technical terms
  errorMessage = errorMessage
    .replace(/\[object Object\]/g, '')
    .replace(/undefined/g, '')
    .replace(/null/g, '')
    .trim();
  
  // If empty after cleaning, return generic message
  if (!errorMessage || errorMessage.length < 3) {
    return 'Something went wrong. Please try again.';
  }
  
  // Capitalize first letter
  return errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
};

export default function ErrorDisplay({
  error,
  onClose,
  type = 'error',
  title,
  showCloseButton = true,
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = getHumanReadableError(error);
  
  const iconMap = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
  };
  
  const Icon = iconMap[type];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[calc(100%-2rem)] sm:w-auto"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-zinc-900 border-2 border-red-200 dark:border-red-800 rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom fade-in duration-300">
        <Icon className="flex-shrink-0 text-red-600 dark:text-red-400" size={20} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-white leading-relaxed">
            {errorMessage}
          </p>
        </div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
            aria-label="Close error"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

