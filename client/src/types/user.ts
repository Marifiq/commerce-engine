/**
 * User-related types and interfaces
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  profileImage?: string;
  gender?: string;
  phoneNumber?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  createdAt?: string;
}

export interface UserState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}
