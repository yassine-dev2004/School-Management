import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://thread-mil-preferred-proper.trycloudflare.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fast in-memory GET micro-cache (15s TTL) + in-flight request deduplication
const GET_CACHE_TTL_MS = 15000;
const getCache = new Map();
const inFlightGets = new Map();

export const clearApiCache = () => {
  getCache.clear();
};

const getCacheKey = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  return `${url}?${new URLSearchParams(params).toString()}`;
};

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
    }, 4000);
  }
};

const onRequestEnd = () => {
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  if (activeRequestsCount === 0) {
    if (slowRequestTimer) clearTimeout(slowRequestTimer);
    notifyWakeStatus(false);
  }
};

// Request interceptor — attach JWT token & invalidate cache on mutations
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

    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get') {
      clearApiCache();
    }
    return config;
  },
  (error) => {
    onRequestEnd();
    return Promise.reject(error);
  }
);

// Response interceptor with smart retry on transient wake/network errors
api.interceptors.response.use(
  (response) => {
    onRequestEnd();
    return response;
  },
  async (error) => {
    const config = error.config;
    const isNetworkOrServerWake =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      [502, 503, 504].includes(error.response?.status);

    if (config && isNetworkOrServerWake && (!config._retryCount || config._retryCount < 2)) {
      config._retryCount = (config._retryCount || 0) + 1;
      notifyWakeStatus(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return api(config);
    }

    onRequestEnd();

    if (error.response && error.response.status === 401) {
      clearApiCache();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Wrap api.get with micro-caching and duplicate in-flight request deduplication
const rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
  const { forceRefresh = false, ...axiosConfig } = config;
  const key = getCacheKey(url, axiosConfig.params);

  if (!forceRefresh) {
    const cached = getCache.get(key);
    if (cached && Date.now() - cached.ts < GET_CACHE_TTL_MS) {
      return Promise.resolve(cached.response);
    }
    const existing = inFlightGets.get(key);
    if (existing) {
      return existing;
    }
  }

  const reqPromise = rawGet(url, axiosConfig)
    .then((res) => {
      getCache.set(key, { ts: Date.now(), response: res });
      inFlightGets.delete(key);
      return res;
    })
    .catch((err) => {
      inFlightGets.delete(key);
      throw err;
    });

  inFlightGets.set(key, reqPromise);
  return reqPromise;
};

// Keep-alive heartbeat every 4 minutes so tunnel + DB connection pool stay warm
let heartbeatInterval = null;
export const startKeepAlive = () => {
  if (heartbeatInterval) return;
  const ping = () =>
    axios.get(`${API_BASE_URL.replace(/\/api$/, '')}/api/health`, { timeout: 10000 }).catch(() => {});
  ping();
  heartbeatInterval = setInterval(ping, 4 * 60 * 1000);
};

export { API_BASE_URL };
export default api;
