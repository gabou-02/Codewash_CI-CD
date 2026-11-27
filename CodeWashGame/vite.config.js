import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // Use relative paths for Electron compatibility
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/main.jsx", "src/**/*.test.{js,jsx}"],
      reporter: ["text", "json-summary", "json", "lcov", "html"],
      reportOnFailure: true,
      // Ratchet: raise these as coverage grows, never lower them
      // without adding a debt item (see docs/DEBT.md).
      thresholds: {
        lines: 53,
        statements: 52,
        functions: 46,
        branches: 50,
        "src/utils/gameUtils.js": { lines: 80 },
        "src/utils/achievementUtils.js": { lines: 90 },
        // Profile save loading (D02): new module, kept at 100 on purpose.
        "src/profile/**": { lines: 100, branches: 100, functions: 100 },
        // i18n layer: written with tests, kept at 100 on purpose.
        "src/i18n/**": { lines: 100, branches: 100, functions: 100 },
        "src/components/ui/LanguageSelector.jsx": { lines: 100, branches: 100 },
        "src/components/drawers/SettingsDrawer.jsx": {
          lines: 100,
          branches: 100,
        },
      },
    },
  },
});
