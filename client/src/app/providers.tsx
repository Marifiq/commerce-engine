'use client';

import { Provider } from 'react-redux';
import { store } from '../redux/store';
import AuthInitializer from './components/AuthInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <AuthInitializer />
            {children}
        </Provider>
    );
}
