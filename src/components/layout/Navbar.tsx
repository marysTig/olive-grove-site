import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { logo } from "@/lib/images";

export function Navbar() {
  const { t, dir } = useI18n();
  const { count, setDrawerOpen } = useCart();
  const { session, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const links: { to: string; label: string }[] = [
    { to: "/", label: t("nav_home") },
    { to: "/products", label: t("nav_products") },
    { to: "/process", label: t("nav_process") },
    { to: "/about", label: t("nav_about") },
    { to: "/recipes", label: t("nav_recipes") },
    { to: "/contact", label: t("nav_contact") },
  ];

  return (
    <header
      dir={dir}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/85 py-2 shadow-soft backdrop-blur-lg"
          : "bg-transparent py-4",
      )}
    >
      <nav className="container-page flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Lem3ansra n Jeddi" className="h-10 w-10" width={40} height={40} />
          <span className="hidden font-display text-lg font-semibold text-olive-dark sm:block">
            {t("brand")}
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link
            to={session ? (isAdmin ? "/admin" : "/account") : "/auth"}
            className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-accent/10 hover:text-primary"
            aria-label={t("nav_account")}
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-full p-2 text-foreground/80 transition-colors hover:bg-accent/10 hover:text-primary"
            aria-label={t("cart_title")}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2 text-foreground/80 lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-lg lg:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent/10"
                  activeProps={{ className: "text-primary bg-accent/10" }}
                  activeOptions={{ exact: l.to === "/" }}
                >
                  {l.label}
                </Link>
              ))}
              <LanguageSwitcher className="mt-2 self-start" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
