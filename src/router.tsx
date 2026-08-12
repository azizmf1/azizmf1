import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// TanStack Start يتوقّع تصدير دالة باسم getRouter من نقطة دخول الراوتر.
export function getRouter() {
  // يدعم الاستضافة تحت مسار فرعي (GitHub Pages) عبر BASE_URL.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return createTanStackRouter({
    routeTree,
    basepath: base || undefined,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
