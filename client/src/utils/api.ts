import axios from 'axios';

// API client instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      localStorage.removeItem('zerogate_token');
      localStorage.removeItem('zerogate_user');
      window.location.href = '/';
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
