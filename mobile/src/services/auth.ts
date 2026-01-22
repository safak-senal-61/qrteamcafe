import { api } from './api';

export const login = async (email: string, password: string) => {
  // Backend AuthController'a uygun yapı:
  const response = await api.post('/auth/customer/login', { email, password });
  return response.data; // { access_token, user? }
};

export const register = async (userData: any) => {
  // userData: { name, email, password, phone? }
  const response = await api.post('/auth/customer/register', userData);
  return response.data;
};
