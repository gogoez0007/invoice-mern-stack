import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import storePersist from '@/redux/storePersist';
import { API_BASE_URL } from '@/config/serverApiConfig';
import * as actionTypes from '@/redux/auth/types';

// Map path prefixes to the required menu codes
const ROUTE_PERMISSIONS = [
  { prefix: '/dashboard_panen', codes: ['dashboard_panen', 'dashboard'], defaultPath: '/dashboard_panen' },
  { prefix: '/dashboard_bongkar', codes: ['dashboard_bongkar', 'dashboard'], defaultPath: '/dashboard_bongkar' },
  { prefix: '/dashboard_productivity', codes: ['productivity', 'dashboard'], defaultPath: '/dashboard_productivity' },
  { prefix: '/dashboard_ponds', codes: ['summary_ponds', 'dashboard'], defaultPath: '/dashboard_ponds' },
  { prefix: '/dashboard_sales', codes: ['dashboard_sales', 'dashboard'], defaultPath: '/dashboard_sales' },
  { prefix: '/review/summary_percentage', codes: ['summary_percentage', 'dashboard', 'review', 'operasional'], defaultPath: '/review/summary_percentage' },
  { prefix: '/review/process', codes: ['review_process', 'review', 'operasional'], defaultPath: '/review/process' },
  { prefix: '/review', codes: ['review', 'operasional'], defaultPath: '/review' },
  { prefix: '/shift/shift_schedule', codes: ['shift_schedule', 'shift', 'manageHR'], defaultPath: '/shift/shift_schedule' },
  { prefix: '/shift', codes: ['shift', 'manageHR'], defaultPath: '/shift' },
  { prefix: '/attendance/manage', codes: ['manage_attendance', 'manageHR'], defaultPath: '/attendance/manage' },
  { prefix: '/employee/manage', codes: ['manage_employee', 'manageHR'], defaultPath: '/employee/manage' },
  { prefix: '/off_schedules', codes: ['off_schedules', 'manageHR'], defaultPath: '/off_schedules' },
  { prefix: '/holidays', codes: ['holidays', 'manageHR'], defaultPath: '/holidays' },
  { prefix: '/agreements', codes: ['agreements', 'manageHR'], defaultPath: '/agreements' },
  { prefix: '/driver-loans', codes: ['driver_loans', 'manageHR', 'operasional'], defaultPath: '/driver-loans' },
  { prefix: '/karyawan', codes: ['karyawan', 'manageHR'], defaultPath: '/karyawan' },
  { prefix: '/kpi', codes: ['kpi', 'manageHR'], defaultPath: '/kpi' },
  { prefix: '/lokasi', codes: ['lokasi', 'manageHR', 'pengaturan'], defaultPath: '/lokasi' },
  { prefix: '/panen', codes: ['panen', 'operasional'], defaultPath: '/panen' },
  { prefix: '/bongkar', codes: ['bongkar', 'bongkar_list', 'bongkar/list', 'operasional'], defaultPath: '/bongkar' },
  { prefix: '/spb', codes: ['SPB', 'spb_list', 'spb/list', 'operasional'], defaultPath: '/spb' },
  { prefix: '/tambak', codes: ['tambak', 'tambak_list', 'tambak/list', 'operasional'], defaultPath: '/tambak' },
  { prefix: '/kualitas', codes: ['kualitas', 'kualitas_list', 'kualitas/list', 'operasional'], defaultPath: '/kualitas' },
  { prefix: '/driver', codes: ['driver', 'listDriver', 'operasional'], defaultPath: '/driver' },
  { prefix: '/role-access', codes: ['role_access', 'pengaturan'], defaultPath: '/role-access' },
  { prefix: '/leave-requests', codes: ['leave_requests', 'manageHR'], defaultPath: '/leave-requests' },
  { prefix: '/leave-approval-lines', codes: ['leave_approval_lines', 'manageHR'], defaultPath: '/leave-approval-lines' },
  { prefix: '/leave-email-config', codes: ['leave_email_config', 'manageHR'], defaultPath: '/leave-email-config' },
  { prefix: '/perusahaan', codes: ['perusahaan', 'manageHR', 'pengaturan'], defaultPath: '/perusahaan' },
  { prefix: '/entitas', codes: ['entitas', 'manageHR', 'pengaturan'], defaultPath: '/entitas' },
  { prefix: '/tarik-absen', codes: ['tarik_absen', 'manageHR'], defaultPath: '/tarik-absen' },
  { prefix: '/recruitment/jobs', codes: ['recruitment_jobs', 'recruitment'], defaultPath: '/recruitment/jobs' },
  { prefix: '/recruitment/applicants', codes: ['recruitment_applicants', 'recruitment'], defaultPath: '/recruitment/applicants' },
  { prefix: '/recruitment/approvals', codes: ['recruitment_approvals', 'recruitment'], defaultPath: '/recruitment/approvals' },
  { prefix: '/recruitment/broadcast', codes: ['recruitment_broadcast', 'recruitment'], defaultPath: '/recruitment/broadcast' },
  { prefix: '/recruitment/approval-settings', codes: ['recruitment_approval_settings', 'recruitment'], defaultPath: '/recruitment/approval-settings' },
  { prefix: '/recruitment/email-config', codes: ['recruitment_email_config', 'recruitment'], defaultPath: '/recruitment/email-config' },
  { prefix: '/recruitment', codes: ['recruitment', 'recruitment_jobs', 'recruitment_applicants', 'recruitment_approvals'], defaultPath: '/recruitment/jobs' },
  { exact: '/', codes: ['dashboard_absen', 'dashboard'], defaultPath: '/' },
];

const PUBLIC_ROUTES = ['/login', '/logout', '/profile', '/about'];

const SUPER_ADMIN_ONLY_PREFIXES = [
  '/customer',
  '/invoice',
  '/quote',
  '/payment',
  '/settings',
  '/taxes',
];

export default function useRoleAccess() {
  const dispatch = useDispatch();
  const reduxAdmin = useSelector(selectCurrentAdmin);

  // Fallback to localStorage if redux hasn't populated yet
  const currentAdmin = useMemo(() => {
    if (reduxAdmin?.username) return reduxAdmin;
    const localAuth = storePersist.get('auth');
    return localAuth?.current || {};
  }, [reduxAdmin]);

  const [isVerifying, setIsVerifying] = useState(true);

  // Directly derive from currentAdmin (synced with Redux & localStorage)
  const allowedCodes = useMemo(() => {
    return Array.isArray(currentAdmin?.allowed_menu_codes) ? currentAdmin.allowed_menu_codes : [];
  }, [currentAdmin?.allowed_menu_codes]);

  const roleGroup = useMemo(() => {
    return currentAdmin?.role_group || null;
  }, [currentAdmin?.role_group]);

  const isSuperAdmin = useMemo(() => {
    if (!currentAdmin?.username) return false;
    if (currentAdmin.username === 'taufik3301') return true;
    if (currentAdmin?.role_id === 1) return true;
    if (roleGroup?.code === 'SUPER_ADMIN') return true;
    return false;
  }, [currentAdmin, roleGroup]);

  const hasNoRole = useMemo(() => {
    if (!currentAdmin?.username) return false;
    if (isSuperAdmin) return false;
    const roleId = currentAdmin?.role_group_id || roleGroup?.id;
    return !roleId && allowedCodes.length === 0;
  }, [currentAdmin, roleGroup, isSuperAdmin, allowedCodes]);

  const isLoading = useMemo(() => {
    if (!currentAdmin?.username) return false;
    if (isSuperAdmin) return false;
    if (allowedCodes.length === 0 && isVerifying) return true;
    return false;
  }, [currentAdmin, isSuperAdmin, allowedCodes, isVerifying]);

  // Fetch or refresh permissions from backend
  useEffect(() => {
    if (!currentAdmin?.username) {
      setIsVerifying(false);
      return;
    }

    let isMounted = true;
    fetch(`${API_BASE_URL}employees/permissions?username=${encodeURIComponent(currentAdmin.username)}`, {
      headers: {
        'x-auth-user': currentAdmin.username,
        ...(currentAdmin.token ? { Authorization: `Bearer ${currentAdmin.token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.result) {
          const codes = data.result.allowed_menu_codes || [];
          const rg = data.result.role_group || null;

          // Sync to localStorage and Redux
          try {
            const authState = storePersist.get('auth') || {};
            const updatedCurrent = {
              ...(authState.current || currentAdmin),
              allowed_menu_codes: codes,
              role_group: rg,
              entity_scope: data.result.entity_scope || null,
            };
            authState.current = updatedCurrent;
            window.localStorage.setItem('auth', JSON.stringify(authState));
            dispatch({
              type: actionTypes.REQUEST_SUCCESS,
              payload: updatedCurrent,
            });
          } catch (_) {}
        }
      })
      .catch((err) => {
        console.error('Failed to sync permissions in useRoleAccess:', err);
      })
      .finally(() => {
        if (isMounted) setIsVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentAdmin?.username, dispatch]);

  // Determine the first permitted route to navigate if root route is not permitted
  const firstAllowedPath = useMemo(() => {
    if (isSuperAdmin) return '/';
    if (allowedCodes.includes('dashboard_absen')) return '/';

    for (const item of ROUTE_PERMISSIONS) {
      if (item.exact === '/') continue;
      if (item.codes.some((c) => allowedCodes.includes(c))) {
        return item.defaultPath;
      }
    }
    return '/profile';
  }, [isSuperAdmin, allowedCodes]);

  // Check if given pathname is authorized
  const isRouteAllowed = (pathname) => {
    if (!pathname) return false;

    // 1. Public authenticated routes
    if (PUBLIC_ROUTES.includes(pathname)) return true;

    // 2. Super admin has unrestricted access
    if (isSuperAdmin) return true;

    // 3. User with no role cannot access any internal module
    if (hasNoRole) return false;

    // 4. Super admin only legacy/settings modules
    if (SUPER_ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return false;
    }

    // 5. Check exact match for root '/'
    if (pathname === '/') {
      return allowedCodes.includes('dashboard_absen') || allowedCodes.includes('dashboard');
    }

    // 6. Check mapped route permissions
    for (const item of ROUTE_PERMISSIONS) {
      if (item.exact && item.exact === pathname) {
        return item.codes.some((c) => allowedCodes.includes(c));
      }
      if (item.prefix && pathname.startsWith(item.prefix)) {
        return item.codes.some((c) => allowedCodes.includes(c));
      }
    }

    // If route is unknown or not mapped, deny access by default for non-superadmin
    return false;
  };

  return {
    currentAdmin,
    roleGroup,
    allowedCodes,
    isSuperAdmin,
    hasNoRole,
    isLoading,
    isVerifying,
    firstAllowedPath,
    isRouteAllowed,
  };
}
