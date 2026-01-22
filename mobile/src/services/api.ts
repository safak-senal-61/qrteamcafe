import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const getApiUrl = () => {
  // Development environment
  if (__DEV__) {
    // Get the IP address of the machine running the Expo server
    const hostUri = Constants.expoConfig?.hostUri;
    const localhost = hostUri?.split(':')[0];
    
    if (localhost) {
      return `http://${localhost}:3001`;
    }
  }
  
  // Fallback / Production URL
  return 'http://localhost:3001'; 
};

export const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token if available
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
