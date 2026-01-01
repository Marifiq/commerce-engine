'use client';

import { Provider } from 'react-redux';
import { store } from '../redux/store';
import AuthInitializer from './components/AuthInitializer';
import { ToastProvider } from './components/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <ToastProvider>
                <AuthInitializer />
                {children}
            </ToastProvider>
        </Provider>
    );
}
