import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 8080,
        proxy: {
            '/api': {
                target: 'http://api-proxy:8081',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
    },
});
