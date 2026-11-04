import { notification } from 'antd';
import storePersist from '@/redux/storePersist';
import * as actionTypes from '@/redux/auth/types';

let isLoggingOut = false;

/**
 * Safely parse a JWT string and extract its decoded JSON payload.
 * Works seamlessly in all browser environments without third-party dependencies.
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

/**
 * Retrieve the current active auth token from persistent storage.
 */
export function getStoredToken() {
  try {
    const auth = storePersist.get('auth');
    return auth?.current?.token || null;
  } catch (_) {
    return null;
  }
}

/**
 * Check whether a JWT token has expired or is invalid.
 * Uses a default buffer of 10 seconds to avoid edge-case race conditions on active API calls.
 */
export function isTokenExpired(token, bufferSeconds = 10) {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= payload.exp - bufferSeconds;
}

/**
 * Get remaining milliseconds before the token expires.
 * Returns 0 if already expired or invalid.
 */
export function getTimeUntilExpiration(token) {
  if (!token) return 0;
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return 0;
  const msRemaining = payload.exp * 1000 - Date.now();
  return msRemaining > 0 ? msRemaining : 0;
}

/**
 * Centralized, idempotent Auto-Logout executor.
 * 1. Saves current path for re-login continuation.
 * 2. Clears storage and session artifacts.
 * 3. Dispatches Redux LOGOUT_SUCCESS state.
 * 4. Displays a friendly warning notification.
 * 5. Redirects user to /login without full app crash.
 */
export function triggerAutoLogout(reason = 'expired', dispatch = null) {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    // 1. Save last path if on an authenticated page
    if (typeof window !== 'undefined' && window.location) {
      const currentPath = window.location.pathname + window.location.search;
      if (
        currentPath &&
        !['/login', '/logout', '/profile', '/about'].includes(window.location.pathname)
      ) {
        window.sessionStorage.setItem('last_redirect_path', currentPath);
      }
    }

    // 2. Clear stored auth state
    window.localStorage.removeItem('auth');
    window.localStorage.removeItem('settings');
    window.localStorage.removeItem('isLogout');
    window.localStorage.removeItem('x-auth-token');

    // 3. Inform the user
    notification.warning({
      key: 'session-expired-notice',
      message: 'Sesi Login Berakhir',
      description: 'Sesi login Anda telah kedaluwarsa demi keamanan. Silakan login kembali.',
      duration: 6,
      placement: 'topRight',
    });

    // 4. Update Redux state if dispatch is available
    if (dispatch) {
      dispatch({ type: actionTypes.LOGOUT_SUCCESS });
    }

    // 5. Navigate to login
    setTimeout(() => {
      window.location.replace('/login');
    }, 300);
  } catch (err) {
    console.error('Failed during auto-logout execution:', err);
    window.location.replace('/login');
  } finally {
    setTimeout(() => {
      isLoggingOut = false;
    }, 4000);
  }
}

