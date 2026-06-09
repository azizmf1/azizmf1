import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// إعداد اختبارات الوحدة (Vitest) — أمر البناء: npm test
// التغطية تُقاس على منطق التطبيق (lib + data) عبر مزوّد v8.
// بوابة الإلزام الدنيا حسب التعميم: 20% (تبدأ 8 فبراير 2026).
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/data/**"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
      reporter: ["text", "text-summary", "html", "lcov"],
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 20,
        statements: 20,
      },
    },
  },
});
