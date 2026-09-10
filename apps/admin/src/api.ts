import axios from 'axios';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = axios.create({ baseURL: `${apiOrigin}/api/v1`, timeout: 15000 });

const ACCESS_KEY = 'adminAccessToken';
const REFRESH_KEY = 'adminRefreshToken';
let refreshPromise: Promise<string> | null = null;

function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('adminUser');
}

api.interceptors.request.use((request) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

api.interceptors.response.use(
  response => response,
  async (error) => {
    const request = error.config;
    const isAuthRequest = typeof request?.url === 'string' && /\/auth\/(login|refresh)/.test(request.url);
    if (error.response?.status !== 401 || request?._retry || isAuthRequest) return Promise.reject(error);

    request._retry = true;
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      clearSession();
      if (window.location.pathname !== '/login') window.location.assign('/login');
      return Promise.reject(error);
    }

    try {
      // All concurrent 401s wait for one refresh/rotation operation.
      if (!refreshPromise) {
        refreshPromise = axios.post(`${apiOrigin}/api/v1/auth/refresh`, { refreshToken }, { timeout: 15000 })
          .then(({ data }) => {
            localStorage.setItem(ACCESS_KEY, data.data.accessToken);
            localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
            return data.data.accessToken as string;
          })
          .finally(() => { refreshPromise = null; });
      }
      const accessToken = await refreshPromise;
      request.headers = request.headers || {};
      request.headers.Authorization = `Bearer ${accessToken}`;
      return api(request); // exactly one retry, protected by _retry
    } catch (refreshError) {
      clearSession();
      if (window.location.pathname !== '/login') window.location.assign('/login');
      return Promise.reject(refreshError);
    }
  },
);

export default api;
