import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth";
import { logo } from "@/lib/images";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { t, lang, dir } = useI18n();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/account" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        toast.success(lang === "ar" ? "تم إنشاء الحساب!" : "Compte créé !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(lang === "ar" ? "فشل تسجيل الدخول" : "Échec de la connexion");
  };

  return (
    <div dir={dir} className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant"
      >
        <a href="/" className="mb-6 flex flex-col items-center gap-2">
          <img src={logo} alt="" className="h-14 w-14" />
          <span className="font-display text-xl font-semibold text-olive-dark">{t("brand")}</span>
        </a>
        <h1 className="mb-6 text-center font-display text-2xl font-bold">
          {mode === "signin" ? t("signin_title") : t("signup_title")}
        </h1>

        <Button onClick={google} variant="outline" className="mb-4 w-full rounded-full">
          {t("continue_google")}
        </Button>
        <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />{t("or")}<span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label className="mb-1.5 block text-sm">{t("full_name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
            </div>
          )}
          <div>
            <Label className="mb-1.5 block text-sm">{t("email")}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="rounded-xl" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">{t("password")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" className="rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? t("loading") : mode === "signin" ? t("signin_btn") : t("signup_btn")}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-primary"
        >
          {mode === "signin" ? t("no_account") : t("have_account")}
        </button>
      </motion.div>
    </div>
  );
}
