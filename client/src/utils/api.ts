import axios from 'axios';

// API client instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store logout callback to be set by AuthContext
let logoutCallback: (() => void) | null = null;

// Function to set the logout callback
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('zerogate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Check if it's a token expiration error
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID' || errorCode === 'TOKEN_MALFORMED') {
        console.log('Token expired or invalid, logging out user');
        
        // Clear storage
        localStorage.removeItem('zerogate_token');
        localStorage.removeItem('zerogate_user');
        
        // Call logout callback to update auth state
        if (logoutCallback) {
          logoutCallback();
        } else {
          // Fallback to redirect if callback not set
          window.location.href = '/';
        }
        
        // Create a more descriptive error for the UI
        const expiredError = new Error('Your session has expired. Please log in again.');
        expiredError.name = 'TokenExpiredError';
        return Promise.reject(expiredError);
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Authentication
  verifyProof: (proof: any, publicInputs: string[], secret: string) =>
    apiClient.post('/api/auth/verify', { proof, publicInputs, secret }),

  generateTestProof: (secret: string) =>
    apiClient.post('/api/auth/test-proof', { secret }),

  getStatus: () =>
    apiClient.get('/api/auth/status'),

  getCurrentUser: () =>
    apiClient.get('/api/auth/me'),

  // Login history and metrics
  getLoginHistory: (limit?: number) =>
    apiClient.get(`/api/auth/history${limit ? `?limit=${limit}` : ''}`),

  getLoginStats: () =>
    apiClient.get('/api/auth/stats'),

  getMetricsHistory: (days?: number) =>
    apiClient.get(`/api/auth/metrics${days ? `?days=${days}` : ''}`),

  // Health check
  healthCheck: () =>
    apiClient.get('/health'),
};

export default apiClient;
