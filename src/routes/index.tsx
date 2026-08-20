import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthed } from "@/lib/session";

// إعادة توجيه: إلى قائمة التقارير إن كان مسجّلًا، وإلا /login
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    throw redirect({ to: isAuthed() ? "/hunting-medical" : "/login" });
  },
  component: () => null,
});
