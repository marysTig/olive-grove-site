import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useAdminAuth } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { logo } from "@/lib/images";

export function Navbar() {
  const { t, dir } = useI18n();
  const { count, setDrawerOpen } = useCart();
  const { session, role, isAdmin, signOut } = useAuth();
  const { user: adminUser, logout: adminLogout } = useAdminAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // True when on the home page and hero is visible (not scrolled past it)
  const isHome = pathname === "/";
  const isHero = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut();
    await adminLogout();
  };

  const isSystemAdmin = role === "admin" || isAdmin || adminUser?.role === "admin";
  const isClient = session && !isSystemAdmin;

  interface NavLink {
    to?: string;
    label: string;
    onClick?: () => void;
  }

  const links: NavLink[] = [
    { to: "/", label: t("nav_home") },
    { to: "/products", label: t("nav_products") },
  ];

  if (session && !isSystemAdmin) {
    links.push(
      { to: "/cart", label: t("cart_title") },
      { to: "/account", label: t("nav_account") },
    );
  }

  if (!session && !isSystemAdmin) {
    links.push({ to: "/contact", label: t("nav_contact") });
  }

  if (isSystemAdmin) {
    links.push({ to: "/admin/dashboard", label: t("nav_admin") });
  }

  if (session || isSystemAdmin) {
    links.push({ label: t("nav_signout"), onClick: handleLogout });
  }

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
          <img src={logo} alt="Lem3ansra n Jeddi" className="h-12 w-12 rounded-full object-contain" width={48} height={48} />
          <span
            className={cn(
              "hidden font-display text-lg font-semibold transition-colors duration-300 sm:block",
              isHero ? "text-white" : "text-olive-dark",
            )}
          >
            {t("brand")}
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l, i) =>
            l.to ? (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isHero
                    ? "text-white/90 hover:text-white"
                    : "text-foreground/80 hover:text-primary",
                )}
                activeProps={{
                  className: isHero ? "text-white font-semibold" : "text-primary",
                }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={l.onClick}
                className={cn(
                  "text-sm font-medium transition-colors cursor-pointer",
                  isHero
                    ? "text-white/90 hover:text-white"
                    : "text-foreground/80 hover:text-primary",
                )}
              >
                {l.label}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" variant={isHero ? "hero" : "default"} />
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "relative rounded-full p-2 transition-colors",
              isHero
                ? "text-white/90 hover:bg-white/15 hover:text-white"
                : "text-foreground/80 hover:bg-accent/10 hover:text-primary",
            )}
            aria-label={t("cart_title")}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -inset-e-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "rounded-full p-2 lg:hidden",
              isHero ? "text-white/90" : "text-foreground/80",
            )}
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
              {links.map((l, i) =>
                l.to ? (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent/10"
                    activeProps={{ className: "text-primary bg-accent/10" }}
                    activeOptions={{ exact: l.to === "/" }}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <button
                    key={i}
                    onClick={l.onClick}
                    className="text-start rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent/10 cursor-pointer"
                  >
                    {l.label}
                  </button>
                )
              )}
              <LanguageSwitcher className="mt-2 self-start" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

