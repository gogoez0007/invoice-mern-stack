// Menentukan base URL secara dinamis agar aman diakses baik dari Localhost, LAN (192.168.x.x), maupun Internet Publik (Domain HTTPS)
const getOriginBase = () => {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Selalu gunakan origin browser saat ini agar di dev memanfaatkan proxy lokal Vite (:5173)
    // dan di production memanfaatkan reverse proxy domain (misal HTTPS)
    return origin.endsWith('/') ? origin : origin + '/';
  }
  return import.meta.env.VITE_BACKEND_SERVER || 'http://192.168.161.111:5000/';
};

export const BASE_URL = getOriginBase();
export const API_BASE_URL = BASE_URL + 'api/';
export const DOWNLOAD_BASE_URL = BASE_URL + 'download/';
export const FILE_BASE_URL = BASE_URL + 'uploads/';
export const WEBSITE_URL = BASE_URL;
export const ACCESS_TOKEN_NAME = 'x-auth-token';

