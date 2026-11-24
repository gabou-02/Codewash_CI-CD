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
      // Application entry point: four lines of ReactDOM bootstrapping with no
      // logic to assert. Excluded so it cannot dilute the thresholds below.
      exclude: ['src/main.jsx'],
      // Ratchet: raise these as coverage grows, never lower them
      // without adding a debt item (see docs/DEBT.md).
      thresholds: {
        'src/utils/gameUtils.js': { lines: 80 },
        'src/utils/achievementUtils.js': { lines: 90 },
        // i18n layer: written with tests, kept at 100 on purpose.
        'src/i18n/**': { lines: 100, branches: 100, functions: 100 },
        'src/components/ui/LanguageSelector.jsx': { lines: 100, branches: 100 },
      },
    },
  },
})
