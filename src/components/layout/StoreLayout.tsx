import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { useI18n } from "@/i18n";

export function StoreLayout({ children }: { children: ReactNode }) {
  const { dir } = useI18n();
  return (
    <div dir={dir} className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
