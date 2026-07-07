import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background/60 p-0.5 text-xs font-medium",
        className,
      )}
    >
      <button
        onClick={() => setLang("fr")}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          lang === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        FR
      </button>
      <button
        onClick={() => setLang("ar")}
        className={cn(
          "rounded-full px-2.5 py-1 font-arabic transition-colors",
          lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        ع
      </button>
    </div>
  );
}
