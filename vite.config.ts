import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'
import workspaceApi from './vite-plugin-workspace-api'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Load runtime config for build-time defines
let runtimeConfig: Record<string, unknown> = {}
try {
  runtimeConfig = JSON.parse(readFileSync(resolve(projectRoot, 'runtime.config.json'), 'utf-8'))
} catch { /* missing config is fine — defaults used */ }

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_ENTROPY__: JSON.stringify(runtimeConfig.appEntropy || ''),
  },
  plugins: [
    react(),
    tailwindcss(),
    workspaceApi(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],
  server: {
    port: 5175,
    proxy: {
      // Route /__ai/ to local Ollama API for the AI draft assistant.
      // Ollama must be running (`ollama serve`) on the default port.
      '/__ai/': {
        target: 'http://127.0.0.1:11434/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__ai\//, ''),
      },
    },
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
          // Vendor: Heavy libraries (lazy-loaded views)
          'vendor-3d': ['three'],
          'vendor-charts': ['recharts', 'd3'],
          'vendor-editor': ['@monaco-editor/react'],
          'vendor-terminal': ['@xterm/xterm'],
          'vendor-markdown': ['marked'],
        }
      }
    }
  }
});
