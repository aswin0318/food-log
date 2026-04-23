import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/auth': 'http://localhost:8000',
      '/api/food': 'http://localhost:8001',
      '/api/macro': 'http://localhost:8002',
      '/api/compliance': 'http://localhost:8003',
    }
  }
})
