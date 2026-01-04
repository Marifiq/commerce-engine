import { apiFetch } from '@/lib/utils/api';
import { API_ENDPOINTS } from '@/lib/constants/api';
import { User } from '@/types/user';

export interface UpdateProfileData {
  name?: string;
  gender?: string;
  phoneNumber?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  profileImage?: string | null;
}

export interface UpdateEmailData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  passwordCurrent: string;
  password: string;
}

export interface ProfileResponse {
  status: string;
  data: {
    user: User;
  };
}

export const profileService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    return await apiFetch(API_ENDPOINTS.PROFILE.GET_ME);
  },

  /**
   * Update profile (name, gender, address, profileImage)
   */
  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    return await apiFetch(API_ENDPOINTS.PROFILE.UPDATE_ME, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Update profile image (supports FormData or base64 string)
   */
  async updateProfileImage(image: File | string): Promise<ProfileResponse> {
    if (image instanceof File) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('profileImage', image);
      
      return await apiFetch(API_ENDPOINTS.PROFILE.UPDATE_ME, {
        method: 'PATCH',
        body: formData,
      });
    } else {
      // Use JSON for base64 string
      return await apiFetch(API_ENDPOINTS.PROFILE.UPDATE_ME, {
        method: 'PATCH',
        body: { profileImage: image },
      });
    }
  },

  /**
   * Update email with password verification
   */
  async updateEmail(data: UpdateEmailData): Promise<ProfileResponse> {
    return await apiFetch(API_ENDPOINTS.PROFILE.UPDATE_EMAIL, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<ProfileResponse> {
    return await apiFetch(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    return await apiFetch(API_ENDPOINTS.PROFILE.DELETE_ACCOUNT, {
      method: 'DELETE',
    });
  },

  /**
   * Request password reset (forgot password)
   */
  async forgotPassword(email: string): Promise<{ status: string; message: string }> {
    return await apiFetch(API_ENDPOINTS.PROFILE.FORGOT_PASSWORD, {
      method: 'POST',
      body: { email },
    });
  },
};

