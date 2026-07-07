import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /admin → redirects to /admin/dashboard
 */
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
});
