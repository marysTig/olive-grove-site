import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiBaseUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { hasPermission, user } = useAdminAuth();
  const navigate = useNavigate();
  const { lang, setLang } = useI18n();
  
  const [emailForm, setEmailForm] = useState({ email: "", currentPassword: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (!hasPermission("manage_settings")) {
      navigate({ to: "/admin/unauthorized" });
    }
    
    if (user) {
      setEmailForm(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [hasPermission, navigate, user]);

  const handleLanguageChange = async (newLang: "ar" | "fr") => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/settings/language`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Failed to update language");
      setLang(newLang);
      toast.success("Langue mise à jour");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Échec de la mise à jour de la langue");
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/settings/email`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Failed to update email");
      
      toast.success("Email mis à jour avec succès !");
      setEmailForm(prev => ({ ...prev, currentPassword: "" }));
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Échec de la mise à jour de l'email");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPassword(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/settings/password`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Failed to update password");
      
      toast.success("Mot de passe mis à jour avec succès !");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Échec de la mise à jour du mot de passe");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérer vos paramètres de compte.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Langue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  variant={lang === "fr" ? "default" : "secondary"}
                  onClick={() => handleLanguageChange("fr")}
                  className="flex-1"
                >
                  Français
                </Button>
                <Button
                  variant={lang === "ar" ? "default" : "secondary"}
                  onClick={() => handleLanguageChange("ar")}
                  className="flex-1"
                >
                  العربية
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mettre à jour l'email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Nouvel email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => {
                      setEmailForm({ ...emailForm, email: e.target.value });
                    }}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email-current-password">Mot de passe actuel</Label>
                  <Input
                    id="email-current-password"
                    type="password"
                    value={emailForm.currentPassword}
                    onChange={(e) => {
                      setEmailForm({ ...emailForm, currentPassword: e.target.value });
                    }}
                    required
                  />
                </div>
                <Button type="submit" disabled={loadingEmail} className="w-full">
                  {loadingEmail ? "Mise à jour..." : "Mettre à jour l'email"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mettre à jour le mot de passe</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                    }}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                    }}
                    required
                    minLength={6}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                    }}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={loadingPassword} className="w-full">
                  {loadingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
