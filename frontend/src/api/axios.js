import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://school-erp-backend-zkuh.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45s timeout to handle cloud spin-up without hanging indefinitely
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Cold-start & slow request tracking
let activeRequestsCount = 0;
let slowRequestTimer = null;

const notifyWakeStatus = (isWaking) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('server-wake-status', {
        detail: { waking: isWaking },
      })
    );
  }
};

const onRequestStart = () => {
  activeRequestsCount++;
  if (activeRequestsCount === 1) {
    slowRequestTimer = setTimeout(() => {
      if (activeRequestsCount > 0) {
        notifyWakeStatus(true);
      }
    }, 3200);
  }
};

const onRequestEnd = () => {
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  if (activeRequestsCount === 0) {
    if (slowRequestTimer) clearTimeout(slowRequestTimer);
    notifyWakeStatus(false);
  }
};

// Request interceptor — attach JWT token and cache buster for GET requests
api.interceptors.request.use(
  (config) => {
    onRequestStart();
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch {}

    // Append timestamp to GET requests to force fresh DB fetch without browser caching
    if (config.method && config.method.toLowerCase() === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => {
    onRequestEnd();
    return Promise.reject(error);
  }
);

// Response interceptor with smart retry on Render sleep / cold start
api.interceptors.response.use(
  (response) => {
    onRequestEnd();
    return response;
  },
  async (error) => {
    const config = error.config;

    // Retry logic for cold start & transient errors (502, 503, 504, timeout, network error)
    const isNetworkOrServerWake =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      [502, 503, 504].includes(error.response?.status);

    if (config && isNetworkOrServerWake && (!config._retryCount || config._retryCount < 2)) {
      config._retryCount = (config._retryCount || 0) + 1;
      notifyWakeStatus(true);
      // Wait 2.5s before retry to give Render container time to complete startup
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return api(config);
    }

    onRequestEnd();

    // Response interceptor — handle 401 (only redirect if not already on login page)
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Keep-alive heartbeat: ping backend health endpoint every 12 minutes to keep Render awake during active sessions
let heartbeatInterval = null;
export const startKeepAlive = () => {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(async () => {
    try {
      await axios.get(`${API_BASE_URL.replace(/\/api$/, '')}/api/health`, { timeout: 15000 });
    } catch {}
  }, 12 * 60 * 1000);
};

export { API_BASE_URL };
export default api;
