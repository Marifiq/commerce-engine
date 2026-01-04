import { apiFetch } from '@/lib/utils/api';
import { LoginCredentials, SignupData, User } from '@/types/user';
import { API_ENDPOINTS } from '@/lib/constants/api';
import { getApiBaseUrl } from '@/lib/config/env';

export interface AuthResponse {
  token: string;
  data: {
    user: User;
  };
}

export const authService = {
  /**
   * Sign up a new user
   */
  async signup(userData: SignupData): Promise<AuthResponse> {
    return await apiFetch(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: userData,
    });
  },

  /**
   * Log in a user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return await apiFetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: credentials,
    });
  },

  /**
   * Initiate Google OAuth flow
   * Redirects to backend Google OAuth endpoint
   */
  googleAuth(): void {
    const baseUrl = getApiBaseUrl();
    const googleAuthUrl = `${baseUrl}${API_ENDPOINTS.AUTH.GOOGLE_AUTH}`;
    window.location.href = googleAuthUrl;
  },

  /**
   * Verify email with code
   */
  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    return await apiFetch('/users/verify-email', {
      method: 'POST',
      body: { email, code },
    });
  },

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<{ status: string; message: string }> {
    return await apiFetch('/users/resend-verification-code', {
      method: 'POST',
      body: { email },
    });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ status: string; message: string }> {
    return await apiFetch(API_ENDPOINTS.PROFILE.FORGOT_PASSWORD, {
      method: 'POST',
      body: { email },
    });
  },

  /**
   * Reset password with code
   */
  async resetPassword(email: string, code: string, password: string): Promise<AuthResponse> {
    return await apiFetch('/users/reset-password', {
      method: 'POST',
      body: { email, code, password },
    });
  },
};

