import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');

      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true });
      } else {
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch (error) {
      set({ token: null, user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
