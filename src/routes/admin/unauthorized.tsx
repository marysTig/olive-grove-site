import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  const { user } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Accès non autorisé
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre rôle ({user?.role === "admin" ? "Administrateur" : "Employé"})
          ne dispose pas des permissions nécessaires pour accéder à cette page.
        </p>
      </div>

      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => navigate({ to: "/admin/dashboard" })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour au tableau de bord
      </Button>
    </div>
  );
}
