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
export const warmServices = () =>
  api.get('/webhooks/warmup', {
    timeout: 15000,
    headers: {
      'Cache-Control': 'no-store',
    },
  }).catch(() => null);

export const startServiceHeartbeat = (intervalMs = 8 * 60 * 1000) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let disposed = false;

  const tick = () => {
    if (disposed) {
      return;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    warmServices();
  };

  tick();

  const intervalId = window.setInterval(tick, intervalMs);
  const handleFocus = () => tick();
  const handleVisibilityChange = () => tick();

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    disposed = true;
    window.clearInterval(intervalId);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

export function removeAdminKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export default api;
