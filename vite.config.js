import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local development proxies /api to the Express backend (localhost:5000 by
// default). Set VITE_PROXY_TARGET to run the dashboard against the deployed
// Render API, and VITE_PROXY_ORIGIN to an origin that backend's CORS accepts
// (e.g. http://localhost:5173) when previewing from another host.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';
const proxyOrigin = process.env.VITE_PROXY_ORIGIN || '';
const previewHost = process.env.VITE_PREVIEW_HOSTS === '1';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: previewHost ? true : undefined,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        configure: (proxy) => {
          if (proxyOrigin) {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', proxyOrigin);
            });
          }
        },
      },
    },
  },
});
