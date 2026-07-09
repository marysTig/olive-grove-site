import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getApiBaseUrl } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const response = await fetch(`${getApiBaseUrl()}/auth/me`, { credentials: "include" });
    if (!response.ok) throw redirect({ to: "/auth" });
    const json = await response.json();
    return { user: json?.data?.user };
  },
  component: () => <Outlet />,
});
