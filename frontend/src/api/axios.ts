import axios, { AxiosHeaders } from 'axios';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

const CSRF_STORAGE_KEY = 'csrf_token_fallback';
let csrfTokenCache = '';
const KNOWN_BROKEN_API_HOSTS = new Set(['api.test.kzii.site']);

const stripQuotes = (value?: string) => String(value || '').trim().replace(/^['"]|['"]$/g, '');

const isKnownBrokenApiHost = (value?: string) => {
  const raw = stripQuotes(value);
  if (!raw || !raw.startsWith('http')) return false;

  try {
    const hostname = new URL(raw).hostname.toLowerCase();
    return KNOWN_BROKEN_API_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

const readStoredCsrfToken = () => {
  try {
    return sessionStorage.getItem(CSRF_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const writeStoredCsrfToken = (token: string) => {
  csrfTokenCache = token;
  try {
    if (token) {
      sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
};

const getCsrfTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('qlsv_token=')) {
      return decodeURIComponent(cookie.substring('qlsv_token='.length));
    }
  }
  return '';
};

const getEffectiveCsrfToken = () => {
  const cookieToken = getCsrfTokenFromCookie();
  if (cookieToken) {
    writeStoredCsrfToken(cookieToken);
    return cookieToken;
  }

  if (csrfTokenCache) return csrfTokenCache;

  const stored = readStoredCsrfToken();
  if (stored) {
    csrfTokenCache = stored;
  }
  return stored;
};

export const getBaseURL = () => {
  const envUrl = stripQuotes(import.meta.env.VITE_API_URL);
  const envTarget = stripQuotes(import.meta.env.VITE_API_TARGET);
  const isCapacitor = Capacitor.getPlatform() !== 'web';

  if (isCapacitor) {
    if (envTarget && !isKnownBrokenApiHost(envTarget)) {
      return envTarget.endsWith('/') ? `${envTarget}api` : `${envTarget}/api`;
    }
    if (envUrl && envUrl.startsWith('http') && !isKnownBrokenApiHost(envUrl)) {
      return envUrl;
    }
    return 'https://test.kzii.site/api';
  }

  if (envUrl === '/api') return '/api';
  if (envUrl && envUrl.startsWith('http') && !isKnownBrokenApiHost(envUrl)) return envUrl;
  return '/api';
};

export const getAssetBaseURL = () => {
  const envTarget = stripQuotes(import.meta.env.VITE_API_TARGET);
  const envUrl = stripQuotes(import.meta.env.VITE_API_URL);
  const isCapacitor = Capacitor.getPlatform() !== 'web';

  if (isCapacitor) {
    if (envTarget && !isKnownBrokenApiHost(envTarget)) {
      return envTarget.endsWith('/') ? envTarget.slice(0, -1) : envTarget;
    }
    if (envUrl && envUrl.startsWith('http') && !isKnownBrokenApiHost(envUrl)) {
      return envUrl.replace(/\/api\/?$/, '');
    }
    return 'https://test.kzii.site';
  }

  if (envUrl && envUrl.startsWith('http') && !isKnownBrokenApiHost(envUrl)) {
    return envUrl.replace(/\/api\/?$/, '');
  }

  return window.location.origin;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (needsCsrf) {
    const csrfToken = getEffectiveCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || new AxiosHeaders();

      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('x-csrf-token', String(csrfToken).trim());
      } else {
        (config.headers as Record<string, any>)['x-csrf-token'] = String(csrfToken).trim();
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const responseToken = response?.data?.csrfToken;
    if (typeof responseToken === 'string' && responseToken) {
      writeStoredCsrfToken(responseToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const message = String(error.response?.data?.message || '');

    if (status === 403 && message.toLowerCase().includes('csrf') && !originalRequest.__csrfRetried) {
      try {
        const refreshRes = await api.get('/auth/me');
        const refreshedToken = refreshRes?.data?.csrfToken;
        if (typeof refreshedToken === 'string' && refreshedToken) {
          writeStoredCsrfToken(refreshedToken);
          originalRequest.__csrfRetried = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['x-csrf-token'] = refreshedToken;
          return api.request(originalRequest);
        }
      } catch {
        // ignore and fall through to normal handling
      }
    }

    if (!error.response) {
      toast.error('Khong the ket noi toi may chu. Vui long kiem tra mang!');
    } else if (error.response?.status === 401) {
      writeStoredCsrfToken('');
      window.dispatchEvent(new CustomEvent('qlsv-unauthorized'));
    }

    return Promise.reject(error);
  },
);

export default api;
