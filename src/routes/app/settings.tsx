import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({ component: SettingsLayout });

function SettingsLayout() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Outlet />
    </div>
  );
}
