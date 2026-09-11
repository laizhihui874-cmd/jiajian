import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // File events from this worktree are not consistently delivered on macOS.
    // Poll so the running workspace serves edits rather than cached modules.
    watch: {usePolling: true, interval: 300},
  },
})
