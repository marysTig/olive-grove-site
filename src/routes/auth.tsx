import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth";
import { logo } from "@/lib/images";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate({ to: "/account" });
    }
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      toast.error("L'inscription publique est désactivée. Seuls les administrateurs peuvent créer des comptes.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant"
      >
        <a href="/" className="mb-6 flex flex-col items-center gap-2">
          <img src={logo} alt="" className="h-20 w-20 rounded-full object-contain" />
          <span className="font-display text-xl font-semibold text-olive-dark">{t("brand")}</span>
        </a>
        <h1 className="mb-6 text-center font-display text-2xl font-bold">{t("signin_title")}</h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">{t("email")}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="rounded-xl" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">{t("password")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" className="rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? t("loading") : t("signin_btn")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          L'inscription publique est désactivée. Les nouveaux comptes clients sont créés par l'administrateur depuis le tableau de bord.
        </p>
      </motion.div>
    </div>
  );
}
