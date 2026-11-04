import { useEffect, useMemo } from 'react';
import { Navigate, useLocation, useRoutes } from 'react-router-dom';
import { useAppContext } from '@/context/appContext';
import useRoleAccess from '@/hooks/useRoleAccess';
import NoRoleAccess from '@/components/AccessDenied/NoRoleAccess';
import ForbiddenAccess from '@/components/AccessDenied/ForbiddenAccess';
import PageLoader from '@/components/PageLoader';

import routes from './routes';

export default function AppRouter() {
  const location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { app } = appContextAction;

  const {
    currentAdmin,
    roleGroup,
    isSuperAdmin,
    hasNoRole,
    isLoading,
    isVerifying,
    firstAllowedPath,
    isRouteAllowed,
  } = useRoleAccess();

  const routesList = useMemo(() => {
    const list = [];
    Object.entries(routes).forEach(([, value]) => {
      list.push(...value);
    });
    return list;
  }, []);

  function getAppNameByPath(path) {
    for (let key in routes) {
      for (let i = 0; i < routes[key].length; i++) {
        if (routes[key][i].path === path) {
          return key;
        }
      }
    }
    return 'default';
  }

  useEffect(() => {
    if (location.pathname === '/') {
      app.default();
    } else {
      const path = getAppNameByPath(location.pathname);
      app.open(path);
    }
  }, [location]);

  const element = useRoutes(routesList);

  // 1. Public authenticated routes (e.g. /logout, /profile, /about, /login)
  if (['/logout', '/profile', '/about', '/login'].includes(location.pathname)) {
    return element;
  }

  // 2. Super Admin bypass (unrestricted access)
  if (isSuperAdmin) {
    return element;
  }

  // If loading permissions for authenticated user or waiting for fresh verification on unverified route
  if ((isLoading || (isVerifying && !isRouteAllowed(location.pathname))) && currentAdmin?.username) {
    return <PageLoader />;
  }

  // 3. User with NO assigned role group:
  // Strictly block all operational and configuration modules
  if (hasNoRole) {
    return <NoRoleAccess username={currentAdmin?.username} />;
  }

  // 4. Root path handling:
  // If user has a valid role but no permission for 'dashboard_absen' ('/'),
  // redirect them to their primary accessible module instead of showing 403
  if (location.pathname === '/' && !isRouteAllowed('/')) {
    if (firstAllowedPath && firstAllowedPath !== '/') {
      return <Navigate to={firstAllowedPath} replace />;
    }
  }

  // 5. Check if user's role has permission for this specific path
  const isAllowed = isRouteAllowed(location.pathname);
  if (!isAllowed) {
    return (
      <ForbiddenAccess
        roleName={roleGroup?.name || 'User'}
        path={location.pathname}
        homePath={firstAllowedPath}
      />
    );
  }

  return element;
}
