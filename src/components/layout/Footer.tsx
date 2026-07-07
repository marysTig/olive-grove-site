import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Facebook, Mail, MapPin, Clock } from "lucide-react";
import { useI18n } from "@/i18n";
import { settingsQuery } from "@/lib/queries";
import { logo } from "@/lib/images";

export function Footer() {
  const { t, dir } = useI18n();
  const { data: settings } = useQuery(settingsQuery());

  return (
    <footer dir={dir} className="bg-sidebar text-sidebar-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-11 w-11" width={44} height={44} />
            <span className="font-display text-lg font-semibold">{t("brand")}</span>
          </div>
          <p className="mt-4 text-sm text-sidebar-foreground/70">{t("tagline")}</p>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-sidebar-primary">
            {t("footer_quick")}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-sidebar-foreground/75">
            <li><Link to="/products" className="hover:text-sidebar-primary">{t("nav_products")}</Link></li>
            <li><Link to="/about" className="hover:text-sidebar-primary">{t("nav_about")}</Link></li>
            <li><Link to="/process" className="hover:text-sidebar-primary">{t("nav_process")}</Link></li>
            <li><Link to="/faq" className="hover:text-sidebar-primary">{t("nav_faq")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-sidebar-primary">
            {t("footer_contact")}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-sidebar-foreground/75">
            {settings?.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" /> {settings.email}
              </li>
            )}
            {settings?.address && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" /> {settings.address}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" /> {t("footer_hours")}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-sidebar-primary">
            {t("brand")}
          </h4>
          <div className="mt-4 flex gap-3">
            {settings?.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noreferrer"
                 className="rounded-full bg-sidebar-accent p-2.5 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings?.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer"
                 className="rounded-full bg-sidebar-accent p-2.5 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground">
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-sidebar-border">
        <div className="container-page py-5 text-center text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} {t("brand")}. {t("footer_rights")}.
        </div>
      </div>
    </footer>
  );
}
