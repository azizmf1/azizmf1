import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// تطبيق SPA ثابت: TanStack Router (file-based) + React + Tailwind + Vite.
// المخرجات في dist/ — يُقدَّم كموقع ثابت على أي مستضيف.
export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ],
});
