'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useRedux';
import { login } from '@/store/features/auth';
import { fetchCart, mergeGuestCart } from '@/store/features/cart';

export default function AuthInitializer() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            try {
                const user = JSON.parse(storedUser);
                // We recreate the login payload as expected by the slice
                dispatch({ 
                    type: 'auth/login/fulfilled', 
                    payload: { data: { user }, token } 
                });
                
                // Fetch user's cart (including abandoned cart items) and merge guest cart
                dispatch(fetchCart()).then(() => {
                    // After fetching existing cart, merge any guest cart items
                    dispatch(mergeGuestCart());
                });
            } catch (error) {
                console.error('Failed to parse user from local storage:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
    }, [dispatch]);


    return null;
}
