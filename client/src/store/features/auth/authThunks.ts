import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '@/lib/utils/api';
import { LoginCredentials, SignupData, User } from '@/types/user';
import { API_ENDPOINTS } from '@/lib/constants/api';

export const signup = createAsyncThunk(
    'auth/signup',
    async (userData: SignupData, { rejectWithValue }) => {
        try {
            const data = await apiFetch('/users/signup', {
                method: 'POST',
                body: userData,
            });
            // Signup now returns email for verification, not token
            return { email: data.data.email, message: data.message };
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const verifyEmail = createAsyncThunk(
    'auth/verifyEmail',
    async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
        try {
            const data = await apiFetch('/users/verify-email', {
                method: 'POST',
                body: { email, code },
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            return data;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const data = await apiFetch('/users/login', {
                method: 'POST',
                body: credentials,
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            return data;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const googleAuth = createAsyncThunk(
    'auth/googleAuth',
    async (token: string, { rejectWithValue }) => {
        try {
            // Store token first
            localStorage.setItem('token', token);
            
            // Fetch user data using the token
            const userData = await apiFetch('/users/me', {
                method: 'GET',
            });
            
            const authResponse = {
                token,
                data: {
                    user: userData.data,
                },
            };
            
            localStorage.setItem('user', JSON.stringify(userData.data));
            return authResponse;
        } catch (err: any) {
            localStorage.removeItem('token');
            return rejectWithValue(err.message);
        }
    }
);

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (data: Partial<User>, { rejectWithValue }) => {
        try {
            const response = await apiFetch(API_ENDPOINTS.PROFILE.UPDATE_ME, {
                method: 'PATCH',
                body: data,
            });
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data.user;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateProfileImage = createAsyncThunk(
    'auth/updateProfileImage',
    async (image: File | string, { rejectWithValue }) => {
        try {
            let body: FormData | { profileImage: string };
            if (image instanceof File) {
                const formData = new FormData();
                formData.append('profileImage', image);
                body = formData;
            } else {
                body = { profileImage: image };
            }

            const response = await apiFetch(API_ENDPOINTS.PROFILE.UPDATE_ME, {
                method: 'PATCH',
                body,
            });
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data.user;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateEmail = createAsyncThunk(
    'auth/updateEmail',
    async (data: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await apiFetch(API_ENDPOINTS.PROFILE.UPDATE_EMAIL, {
                method: 'PATCH',
                body: data,
            });
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data.user;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

