export const API_BASE_URL =
  import.meta.env.PROD
    ? '/api/'
    : (import.meta.env.VITE_BACKEND_SERVER ? import.meta.env.VITE_BACKEND_SERVER + 'api/' : 'http://192.168.120.12:5000/api/');
export const BASE_URL =
  import.meta.env.PROD
    ? '/'
    : (import.meta.env.VITE_BACKEND_SERVER || 'http://192.168.120.12:5000/');

export const WEBSITE_URL = import.meta.env.PROD
  ? '/'
  : (import.meta.env.VITE_BACKEND_SERVER || 'http://192.168.120.12:5000/');
export const DOWNLOAD_BASE_URL =
  import.meta.env.PROD
    ? '/download/'
    : (import.meta.env.VITE_BACKEND_SERVER ? import.meta.env.VITE_BACKEND_SERVER + 'download/' : 'http://localhost:8888/download/');
export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL;
