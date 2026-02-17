import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5175,
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      '@github/spark/hooks': resolve(projectRoot, 'src/lib/local-storage-kv.ts'),
      '@github/spark/spark': resolve(projectRoot, 'src/lib/local-storage-kv.ts'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React core
          'vendor-react': ['react', 'react-dom'],
          // Vendor: Radix UI primitives
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-separator',
          ],
          // Vendor: Icons
          'vendor-icons': ['@phosphor-icons/react'],
        }
      }
    }
  }
});
