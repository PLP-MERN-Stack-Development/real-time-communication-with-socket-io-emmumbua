import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:5000',
      },
    },
  },
  define: {
    __APP_NAME__: JSON.stringify('BeanStream Lounge'),
  },
});

