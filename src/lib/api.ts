// API Configuration for Vercel Deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Dashboard
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  
  // Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_PROFILE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  
  // Courses
  COURSES: `${API_BASE_URL}/api/courses`,
  COURSE_DETAILS: (id: string) => `${API_BASE_URL}/api/courses/${id}`,
  
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // Payments
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  CREATE_PAYMENT: `${API_BASE_URL}/api/payments/create`,
  
  // Subscriptions
  SUBSCRIPTIONS: `${API_BASE_URL}/api/subscriptions`,
  SUBSCRIBE: `${API_BASE_URL}/api/subscriptions/subscribe`,
};

// API Client Configuration
export const apiClient = {
  baseURL: API_BASE_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },

  // GET request
  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  // POST request
  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT request
  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE request
  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

// Supabase Configuration (for future migration)
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export default apiClient;
