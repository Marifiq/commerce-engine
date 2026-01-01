'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/features/userSlice';

export default function AuthInitializer() {
    const dispatch = useDispatch();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            try {
                const user = JSON.parse(storedUser);
                // We recreate the login payload as expected by the slice
                dispatch({ 
                    type: 'user/login/fulfilled', 
                    payload: { data: { user }, token } 
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
