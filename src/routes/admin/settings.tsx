import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { Settings } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasPermission("manage_settings")) {
      navigate({ to: "/admin/unauthorized" });
    }
  }, [hasPermission, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurez les paramètres de votre boutique.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <Settings className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          Les paramètres seront disponibles ici.
        </p>
      </div>
    </div>
  );
}
