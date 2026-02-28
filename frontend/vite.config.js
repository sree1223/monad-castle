import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    // Privy SDK loaded optionally at runtime — excluded from pre-bundling
    exclude: ['@privy-io/react-auth'],
  },
  build: {
    // Inline small assets, split large ones
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // Treat Privy as optional external — loaded at runtime if installed
      external: (id) => id === '@privy-io/react-auth' && false,
    },
  },
})

