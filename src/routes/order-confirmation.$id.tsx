import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/order-confirmation/$id")({
  component: Confirmation,
});

function Confirmation() {
  const { id } = useParams({ from: "/order-confirmation/$id" });
  const { t } = useI18n();
  return (
    <StoreLayout>
      <div className="container-page flex min-h-[70vh] items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-elegant"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }}>
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          </motion.div>
          <h1 className="mt-5 font-display text-2xl font-bold">{t("order_confirmed")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("order_thanks")}</p>
          <div className="mt-5 rounded-xl bg-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("order_number")}</p>
            <p className="font-display text-xl font-bold text-primary">#{id}</p>
          </div>
          <Button asChild className="mt-6 w-full rounded-full">
            <Link to="/">{t("back_home")}</Link>
          </Button>
        </motion.div>
      </div>
    </StoreLayout>
  );
}
