import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['parish-clarify-snowboard.ngrok-free.dev'],
  },
  base: '/cv/',
})
