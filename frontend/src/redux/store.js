import { configureStore } from '@reduxjs/toolkit';

import lang from '@/locale/translation/en_us';

import rootReducer from './rootReducer';
import storePersist from './storePersist';
import { isTokenExpired } from '@/utils/authSession';

const AUTH_INITIAL_STATE = {
  current: {},
  isLoggedIn: false,
  isLoading: false,
  isSuccess: false,
};

// Validate stored token before preloading state to prevent stale boot
const savedAuth = storePersist.get('auth');
const token = savedAuth?.current?.token;
const hasValidSession = Boolean(savedAuth && savedAuth.isLoggedIn && token && !isTokenExpired(token));

let auth_state = AUTH_INITIAL_STATE;
if (hasValidSession) {
  auth_state = {
    ...savedAuth,
    isLoading: false, // JANGAN PERNAH izinkan boot dengan status loading
  };
} else {
  // Bersihkan data sampah/stale dari localStorage
  storePersist.remove('auth');
  storePersist.remove('x-auth-token');
  auth_state = AUTH_INITIAL_STATE;
}

const initialState = { auth: auth_state };

const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
  devTools: import.meta.env.PROD === false, // Enable Redux DevTools in development mode
});

export default store;
