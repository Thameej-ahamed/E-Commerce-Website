import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8100/api';

const getHeaders = () => {
    const token = localStorage.getItem('xyloToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiClient = {
  get: async (endpoint) => {
    console.log(`[Real API] GET ${endpoint}`);
    try {
      const response = await axios.get(`${API_BASE_URL}/${endpoint}`, { headers: getHeaders() });
      return response;
    } catch (error) {
      console.error(`[Real API] GET ${endpoint} Error:`, error);
      throw error;
    }
  },
  post: async (endpoint, data) => {
    console.log(`[Real API] POST ${endpoint}`, data);
    try {
      const response = await axios.post(`${API_BASE_URL}/${endpoint}`, data, { headers: getHeaders() });
      return response;
    } catch (error) {
      console.error(`[Real API] POST ${endpoint} Error:`, error);
      throw error;
    }
  },
  put: async (endpoint, data) => {
    console.log(`[Real API] PUT ${endpoint}`, data);
    try {
      const response = await axios.put(`${API_BASE_URL}/${endpoint}`, data, { headers: getHeaders() });
      return response;
    } catch (error) {
      console.error(`[Real API] PUT ${endpoint} Error:`, error);
      throw error;
    }
  },
  delete: async (endpoint) => {
    console.log(`[Real API] DELETE ${endpoint}`);
    try {
      const response = await axios.delete(`${API_BASE_URL}/${endpoint}`, { headers: getHeaders() });
      return response;
    } catch (error) {
      console.error(`[Real API] DELETE ${endpoint} Error:`, error);
      throw error;
    }
  }
};

export async function withRetry(request, { retries = 2, delay = 400 } = {}) {
  // Mock doesn't need retries, but we keep the signature for compatibility
  return await request();
}
