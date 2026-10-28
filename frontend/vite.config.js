import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

    const proxy_url =
    process.env.VITE_DEV_REMOTE === 'remote'
      ? process.env.VITE_BACKEND_SERVER
      : (process.env.VITE_BACKEND_SERVER || 'http://192.168.161.111:5000/');


  return defineConfig({
    base: '/', // ✅ Ubah base di sini
    plugins: [react(), svgr()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: proxy_url,
          changeOrigin: true,
          secure: false,
        },
        '/uploads/leave_docs': {
          target: 'https://attendance.delmargroup.co.id',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: proxy_url,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 5175,
      host: true,
      proxy: {
        '/api': {
          target: proxy_url,
          changeOrigin: true,
          secure: false,
        },
        '/uploads/leave_docs': {
          target: 'https://attendance.delmargroup.co.id',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: proxy_url,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  });
};
