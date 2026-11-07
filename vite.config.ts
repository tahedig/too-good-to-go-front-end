import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    // اجازه‌ی دسترسی از هاست‌های پیش‌نمایش (مثلاً sandboxها) در حالت توسعه
    allowedHosts: ['.e2b.app'],
  },
})