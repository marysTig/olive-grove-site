import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { productsQuery, categoriesQuery } from "@/lib/queries";
import { finalPrice } from "@/lib/types";
import { categoryName } from "@/lib/format";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Nos Produits — Lem3ansra n Jeddi" },
      { name: "description", content: "Découvrez notre gamme d'huiles d'olive premium extra vierge, aromatisées et coffrets cadeaux." },
      { property: "og:title", content: "Nos Produits — Lem3ansra n Jeddi" },
      { property: "og:description", content: "Huiles d'olive premium extra vierge, aromatisées et coffrets cadeaux." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t, lang } = useI18n();
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") list = list.filter((p) => p.category_id === category);
    if (inStock) list = list.filter((p) => p.stock > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name_fr.toLowerCase().includes(q) || p.name_ar.includes(search),
      );
    }
    switch (sort) {
      case "price_asc": list.sort((a, b) => finalPrice(a) - finalPrice(b)); break;
      case "price_desc": list.sort((a, b) => finalPrice(b) - finalPrice(a)); break;
      case "popular": list.sort((a, b) => b.rating - a.rating); break;
    }
    return list;
  }, [products, category, inStock, search, sort]);

  return (
    <StoreLayout>
      <div className="bg-cream pt-28 pb-10">
        <div className="container-page text-center">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{t("products_title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("products_sub")}</p>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <SlidersHorizontal className="h-5 w-5 text-primary" /> {t("filter_title")}
          </div>

          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              className="ps-9 rounded-full"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">{t("filter_category")}</p>
            <div className="space-y-1">
              <FilterOption active={category === "all"} onClick={() => setCategory("all")} label={t("filter_all")} />
              {categories.map((c) => (
                <FilterOption
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                  label={categoryName(c, lang)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="instock" checked={inStock} onCheckedChange={(v) => setInStock(!!v)} />
            <Label htmlFor="instock" className="text-sm font-normal">{t("filter_instock")}</Label>
          </div>
        </aside>

        {/* Products */}
        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{filtered.length} {t("nav_products").toLowerCase()}</p>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48 rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sort_newest")}</SelectItem>
                <SelectItem value="popular">{t("sort_popular")}</SelectItem>
                <SelectItem value="price_asc">{t("sort_price_asc")}</SelectItem>
                <SelectItem value="price_desc">{t("sort_price_desc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">{t("no_products")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}

function FilterOption({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-1.5 text-start text-sm transition-colors ${
        active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
