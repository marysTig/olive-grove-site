import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "default" | "hero";
}

export function LanguageSwitcher({ className, variant = "default" }: LanguageSwitcherProps) {
  const { lang, setLang } = useI18n();
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full p-0.5 text-xs font-medium transition-colors duration-300",
        isHero
          ? "border border-white/30 bg-white/10"
          : "border border-border bg-background/60",
        className,
      )}
    >
      <button
        onClick={() => setLang("fr")}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          lang === "fr"
            ? isHero
              ? "bg-white/25 text-white"
              : "bg-primary text-primary-foreground"
            : isHero
              ? "text-white/70 hover:text-white"
              : "text-muted-foreground hover:text-foreground",
        )}
      >
        FR
      </button>
      <button
        onClick={() => setLang("ar")}
        className={cn(
          "rounded-full px-2.5 py-1 font-arabic transition-colors",
          lang === "ar"
            ? isHero
              ? "bg-white/25 text-white"
              : "bg-primary text-primary-foreground"
            : isHero
              ? "text-white/70 hover:text-white"
              : "text-muted-foreground hover:text-foreground",
        )}
      >
        ع
      </button>
    </div>
  );
}

