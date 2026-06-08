import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthed } from "@/lib/session";

// إعادة توجيه: إلى /dashboard إن كان مسجّلًا، وإلا /login
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    throw redirect({ to: isAuthed() ? "/dashboard" : "/login" });
  },
  component: () => null,
});
