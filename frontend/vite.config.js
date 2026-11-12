import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router-dom') || id.includes('/react/') || id.includes('/react-dom/') || id.includes('\\react\\') || id.includes('\\react-dom\\')) {
            return 'react-vendor';
          }
          if (id.includes('lucide-react') || id.includes('axios')) {
            return 'ui-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
})
