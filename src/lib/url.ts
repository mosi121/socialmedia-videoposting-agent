import { NextRequest } from 'next/server';

/**
 * Dynamically resolves the base URL of the application.
 * Supports Localhost, Vercel deployments, custom domains, and reverse proxies.
 */
export function getBaseUrl(req?: NextRequest): string {
  // 1. Explicit custom URL defined in environment
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  // 2. Vercel preview or production deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  // 3. Fallback to request headers
  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }

    const host = req.headers.get('host');
    if (host) {
      const proto = host.includes('localhost') ? 'http' : 'https';
      return `${proto}://${host}`;
    }

    if (req.nextUrl?.origin) {
      return req.nextUrl.origin;
    }
  }

  // 4. Default fallback
  return 'http://localhost:3000';
}
