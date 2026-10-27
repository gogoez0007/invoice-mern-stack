import { useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '@/redux/auth/actions';
import { crud } from '@/redux/crud/actions';
import { erp } from '@/redux/erp/actions';
import PageLoader from '@/components/PageLoader';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    dispatch(crud.resetState());
    dispatch(erp.resetState());

    window.localStorage.removeItem('auth');
    window.localStorage.removeItem('settings');
    window.localStorage.removeItem('isLogout');
    window.localStorage.removeItem('x-auth-token');
    window.sessionStorage.clear();
  }, [dispatch]);

  useEffect(() => {
    const doLogout = async () => {
      try {
        await dispatch(logoutAction());
      } finally {
        window.location.replace('/login');
      }
    };

    doLogout();
  }, [dispatch]);

  return <PageLoader />;
};
export default Logout;
