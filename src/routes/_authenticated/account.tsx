import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, Package, User, Mail, Lock } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useAdminAuth } from "@/lib/admin-auth";
import { useI18n } from "@/i18n";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  component: Account,
});

const STATUS_KEY = {
  pending: "status_pending",
  confirmed: "status_confirmed",
  shipped: "status_shipped",
  delivered: "status_delivered",
  cancelled: "status_cancelled",
} as const;

function Account() {
  const { user, signOut } = useAuth();
  const { user: adminUser, isAuthenticated: isAdmin, signOut: adminSignOut } = useAdminAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Email change state
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { data: orders = [] } = Route.useSuspenseQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/orders`, { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to load orders");
      return (json?.data ?? []) as Order[];
    },
  });

  const handleSignOut = async () => {
    if (isAdmin) {
      await adminSignOut();
    } else {
      await signOut();
    }
    navigate({ to: "/" });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.currentPassword) return;
    setEmailLoading(true);

    try {
      const endpoint = isAdmin
        ? `${getApiBaseUrl()}/admin/settings/email`
        : `${getApiBaseUrl()}/account/email`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailForm.newEmail,
          currentPassword: emailForm.currentPassword,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to update email");
      toast.success(lang === "ar" ? "تم تحديث البريد الإلكتروني" : "Email updated successfully");
      setEmailForm({ newEmail: "", currentPassword: "" });
      // Refresh auth state
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    setPasswordLoading(true);

    try {
      const endpoint = isAdmin
        ? `${getApiBaseUrl()}/admin/settings/password`
        : `${getApiBaseUrl()}/account/password`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to update password");
      toast.success(lang === "ar" ? "تم تحديث كلمة المرور" : "Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const currentUser = isAdmin ? adminUser : user;

  return (
    <StoreLayout>
      <div className="container-page min-h-[60vh] pt-28 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("account_title")}</h1>
            <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> {t("nav_signout")}
          </Button>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="rounded-full bg-muted">
            <TabsTrigger value="orders" className="rounded-full">
              {t("my_orders")}
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full">
              {t("my_profile")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="pt-6">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                <Package className="h-10 w-10 opacity-50" />
                {t("no_orders")}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
                  >
                    <div>
                      <p className="font-semibold">Order #{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {t(STATUS_KEY[order.status])}
                    </span>
                    <span className="font-bold text-primary">{formatPrice(order.total, lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="profile" className="pt-6 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "تغيير البريد الإلكتروني" : "Change email"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "البريد الحالي" : "Current email"}</Label>
                    <Input
                      value={currentUser?.email ?? ""}
                      disabled
                      className="rounded-xl bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "البريد الجديد" : "New email"}</Label>
                    <Input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "كلمة المرور الحالية" : "Current password"}</Label>
                    <Input
                      type="password"
                      value={emailForm.currentPassword}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, currentPassword: e.target.value })
                      }
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={emailLoading}
                    className="rounded-full w-full sm:w-auto"
                  >
                    {emailLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        {lang === "ar" ? "جار الحفظ" : "Saving..."}
                      </span>
                    ) : (
                      t("save")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "تغيير كلمة المرور" : "Change password"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "كلمة المرور الحالية" : "Current password"}</Label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "كلمة المرور الجديدة" : "New password"}</Label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="rounded-xl"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {lang === "ar"
                        ? "يجب أن تكون 8 أحرف على الأقل، وتحتوي على حرف كبير، حرف صغير، رقم، وحرف خاص"
                        : "Must be at least 8 characters, include uppercase, lowercase, number, and special character"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-full w-full sm:w-auto"
                  >
                    {passwordLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        {lang === "ar" ? "جار الحفظ" : "Saving..."}
                      </span>
                    ) : (
                      t("save")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StoreLayout>
  );
}
