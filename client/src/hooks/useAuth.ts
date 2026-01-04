/**
 * Custom hook for auth state and actions
 */

import { useAppSelector, useAppDispatch } from './useRedux';
import { logout, clearError, login, signup } from '@/store/features/auth';
import { LoginCredentials, SignupData } from '@/types/user';

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.user);

  return {
    ...auth,
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
    login: (credentials: LoginCredentials) => dispatch(login(credentials)),
    signup: (userData: SignupData) => dispatch(signup(userData)),
  };
}

