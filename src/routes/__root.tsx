import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/hms/Toast";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
