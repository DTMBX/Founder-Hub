import { defineConfig, configDefaults } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Only test root src/ and ops/ — exclude XTX396/ (it has its own aliased paths)
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'ops/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'XTX396/**'],
    setupFiles: ['./src/test/setup.ts'],
    // Vitest 4 equivalent of the old singleFork:true.
    // With isolate:true (default), 39 separate jsdom environments are created and
    // accumulate ~4 GB before the last file OOM-crashes the worker.
    // isolate:false shares the module graph across all files so jsdom/modules are
    // loaded once; maxWorkers:1 keeps everything in one process (no IPC overhead).
    // execArgv --expose-gc allows afterAll hooks to manually hint GC between files.
    maxWorkers: 1,
    isolate: false,
    execArgv: ['--expose-gc'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
