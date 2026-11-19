import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for Electron compatibility
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // Ratchet: raise these as coverage grows, never lower them
      // without adding a debt item (see docs/DEBT.md).
      thresholds: {
        'src/utils/gameUtils.js': { lines: 80 },
        'src/utils/achievementUtils.js': { lines: 90 },
      },
    },
  },
})
