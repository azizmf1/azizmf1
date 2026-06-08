import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Shell } from "@/components/hms/Shell";
import { isAuthed } from "@/lib/session";

// تخطيط التطبيق (TopBar + Sidebar) — مسار بلا مسار pathless
export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!isAuthed()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
