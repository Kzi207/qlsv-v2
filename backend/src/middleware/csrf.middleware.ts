import type { NextFunction, Request, Response } from 'express';
import { CSRF_COOKIE_NAME, getCookieValue } from '../utils/security';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXCLUDED_PATHS = new Set(['/api/auth/login', '/api/auth/register', '/api/payments/sepay/webhook']);

const normalizePath = (req: Request) => {
  const fullPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
  return (fullPath || '/').replace(/\/$/, '') || '/';
};

const isExcludedPath = (path: string) => {
  return EXCLUDED_PATHS.has(path) || path.startsWith('/api/payments/sepay/webhook') || path.includes('/payments/sepay/webhook');
};

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const path = normalizePath(req);
  console.log(`[CSRF Check] Method: ${req.method}, Path: ${req.path}, OriginalUrl: ${req.originalUrl}`);

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const authHeader = req.headers.authorization?.toString().toLowerCase() || '';
  const hasWebhookAuth = authHeader.includes('apikey') || authHeader.includes('bearer');
  
  const isPaymentPath = path.includes('/payments/sepay/webhook');
  const excluded = isExcludedPath(path);
  
  console.log(`[CSRF DEBUG] Path: ${path}, Excluded: ${excluded}, WebhookAuth: ${hasWebhookAuth}, isPaymentPath: ${isPaymentPath}`);
  
  if (excluded || (isPaymentPath && hasWebhookAuth)) {
    console.log(`[CSRF Bypass] Bypassing for path: ${path}`);
    return next();
  }

  const csrfCookie = (getCookieValue(req, CSRF_COOKIE_NAME) || '').trim();
  const rawHeader = req.header('x-csrf-token') || req.header('X-CSRF-Token') || '';
  const csrfHeader = (rawHeader.split(',')[0] ?? '').trim();

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    const reason = !csrfCookie ? 'Cookie missing' : (!csrfHeader ? 'Header missing' : 'Token mismatch');
    console.warn(`[CSRF Failed] Path: ${path}, Method: ${req.method}, Reason: ${reason}`);

    return res.status(403).json({
      message: 'CSRF token is missing or invalid',
      debug: {
        reason,
        hasCookie: Boolean(csrfCookie),
        hasHeader: Boolean(csrfHeader),
        path,
        method: req.method,
        receivedCookies: Object.keys(req.cookies || {}),
        hasAuthHeader: Boolean(req.headers.authorization)
      }
    });
  }

  return next();
};
