import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import {
  getStoredToken,
  isTokenExpired,
  getTimeUntilExpiration,
  triggerAutoLogout,
} from '@/utils/authSession';

/**
 * Custom React hook for background token expiration monitoring.
 * - Checks immediately on app mount.
 * - Schedules a high-accuracy timeout for token expiration.
 * - Runs a periodic 30s heartbeat to safeguard against OS sleep/suspend.
 * - Re-evaluates whenever tab visibility or window focus changes.
 */
export default function useTokenExpirationWatcher() {
  const dispatch = useDispatch();
  const { isLoggedIn, current } = useSelector(selectAuth);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const checkToken = () => {
      const token = current?.token || getStoredToken();
      if (!token) return false;

      if (isTokenExpired(token)) {
        triggerAutoLogout('expired', dispatch);
        return true;
      }
      return false;
    };

    // 1. Initial check
    if (checkToken()) return;

    // 2. Set timeout for exact expiration moment
    const token = current?.token || getStoredToken();
    const msUntilExpiry = getTimeUntilExpiration(token);

    if (msUntilExpiry > 0) {
      // Prevent 32-bit integer overflow in setTimeout (~24.8 days max)
      const safeDelay = Math.min(msUntilExpiry, 2147483647);
      timerRef.current = setTimeout(() => {
        triggerAutoLogout('expired', dispatch);
      }, safeDelay);
    }

    // 3. Periodic check every 30 seconds
    const intervalId = setInterval(() => {
      checkToken();
    }, 30000);

    // 4. Tab visibility and focus handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkToken();
      }
    };
    const handleFocus = () => {
      checkToken();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoggedIn, current?.token, dispatch]);
}

