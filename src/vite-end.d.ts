/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string
declare const __APP_ENTROPY__: string

interface Window {
  spark: {
    llm: (prompt: string, model?: string, json?: boolean) => Promise<string>
    [key: string]: unknown
  }
}
