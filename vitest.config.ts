import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

// إعداد اختبارات الوحدة (Vitest) — أمر البناء: npm test
// التغطية تُقاس على منطق التطبيق (lib + data) عبر مزوّد v8.
// بوابة الإلزام الدنيا حسب التعميم: 20% (تبدأ 8 فبراير 2026).
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // النطاق يطابق ما يقيسه الـ pipeline على المشروع كاملًا (لا مجلدات مختارة).
      // يُستثنى المُولَّد ونقاط الدخول وملفات الاختبار فقط.
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "src/routeTree.gen.ts",
        "src/main.tsx",
        "src/router.tsx",
        "src/vite-env.d.ts",
      ],
      reporter: ["text", "text-summary", "html", "lcov"],
      // البوابة الدنيا 20% (سترتفع 40%→60%). ملاحظة: مع توسيع النطاق للمشروع
      // كاملًا قد لا تُجتاز العتبة حتى تُضاف اختبارات للمكوّنات — انظر STANDARDS.md §4.
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 20,
        statements: 20,
      },
    },
  },
});
