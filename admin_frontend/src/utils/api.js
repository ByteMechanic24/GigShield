import axios from 'axios';

const STORAGE_KEY = 'gigshield_admin_key';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const adminKey = localStorage.getItem(STORAGE_KEY);
    if (adminKey) {
      config.headers['X-Admin-Key'] = adminKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);

const handle = async (requestPromise) => {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Unknown admin console error';
    throw new Error(message);
  }
};

export const loginAdmin = (adminKey) =>
  handle(
    api.post(
      '/admin/session',
      {},
      {
        headers: {
          'X-Admin-Key': adminKey,
        },
      }
    )
  );

export const fetchAdminStats = (params = {}) => handle(api.get('/claims/admin/all', { params }));
export const reviewClaim = (id, data) => handle(api.put(`/claims/${id}/review`, data));
export const testVerification = (data) => handle(api.post('/admin/test-verification', data));

export function removeAdminKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export default api;
