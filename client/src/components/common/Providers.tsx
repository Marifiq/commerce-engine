'use client';

import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store/store';
import { AuthInitializer, ErrorBoundary } from '@/components/common';
import { ToastProvider, ErrorProvider } from '@/contexts';
import { queryClient } from '@/lib/react-query/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <Provider store={store}>
                    <ErrorProvider>
                        <ToastProvider>
                            <AuthInitializer />
                            {children}
                        </ToastProvider>
                    </ErrorProvider>
                </Provider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

