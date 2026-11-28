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
        // Subject rule: 100 % on code we write, 80 % on lines we modify in
        // code we inherited. The 80 % half is enforced per PR by the
        // diff-coverage gate in ci.yml; the 100 % half is the per-module
        // entries below. Add a line here with every new module.
        // Globals are a ratchet: raise as coverage grows, never lower without
        // a debt item.
        lines: 53,
        statements: 52,
        functions: 46,
        branches: 50,
        // Profile save loading (D02): new module, kept at 100 on purpose.
        "src/profile/**": { lines: 100, branches: 100, functions: 100 },
        "src/i18n/**": { lines: 100, branches: 100, functions: 100 },
        "src/theme/**": { lines: 100, branches: 100, functions: 100 },
        "src/constants/micStatus.js": {
          lines: 100,
          branches: 100,
          functions: 100,
        },
        "src/components/ui/LanguageSelector.jsx": { lines: 100, branches: 100 },
        // Inherited files we rewrote far enough to hold to the same bar.
        "src/components/drawers/SettingsDrawer.jsx": {
          lines: 100,
          branches: 100,
        },
        // Inherited, ratcheted as coverage grows, never lowered without a
        // debt item (see docs/DEBT.md).
        "src/utils/gameUtils.js": { lines: 80 },
        "src/utils/achievementUtils.js": { lines: 90 },
      },
    },
  },
});
