import { createSlice } from '@reduxjs/toolkit';
import { UserState } from '@/types/user';
import { signup, verifyEmail, login, googleAuth, updateProfile, updateProfileImage, updateEmail } from './authThunks';

// Initial state
const initialState: UserState = {
    currentUser: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
    loading: false,
    error: null,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.currentUser = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Signup
            .addCase(signup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signup.fulfilled, (state) => {
                state.loading = false;
                // Signup now just returns email for verification, user is not authenticated yet
            })
            .addCase(signup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Verify Email
            .addCase(verifyEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyEmail.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.currentUser = action.payload.data.user;
                state.token = action.payload.token;
            })
            .addCase(verifyEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.currentUser = action.payload.data.user;
                state.token = action.payload.token;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Google Auth
            .addCase(googleAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.currentUser = action.payload.data.user;
                state.token = action.payload.token;
            })
            .addCase(googleAuth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update Profile
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.currentUser = action.payload;
            })
            // Update Profile Image
            .addCase(updateProfileImage.fulfilled, (state, action) => {
                state.currentUser = action.payload;
            })
            // Update Email
            .addCase(updateEmail.fulfilled, (state, action) => {
                state.currentUser = action.payload;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

