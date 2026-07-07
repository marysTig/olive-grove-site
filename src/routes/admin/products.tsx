import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ImageIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

interface AdminProduct {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  description_fr?: string;
  description_ar?: string;
  price: number;
  discount_pct: number;
  stock: number;
  category_id?: string | null;
  images: string[];
  image_public_ids: string[];
  badge?: string | null;
  volume_ml?: number | null;
  origin?: string | null;
  harvest_date?: string | null;
  featured: boolean;
  active: boolean;
  createdAt?: string;
}

interface ProductFormState {
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  price: string;
  discount_pct: string;
  stock: string;
  category_id: string;
  images: string[];
  image_public_ids: string[];
  badge: string;
  volume_ml: string;
  origin: string;
  harvest_date: string;
  featured: boolean;
  active: boolean;
}

const API_BASE = getApiBaseUrl();

function createEmptyForm(): ProductFormState {
  return {
    name_fr: "",
    name_ar: "",
    description_fr: "",
    description_ar: "",
    price: "",
    discount_pct: "",
    stock: "",
    category_id: "",
    images: [],
    image_public_ids: [],
    badge: "",
    volume_ml: "",
    origin: "",
    harvest_date: "",
    featured: false,
    active: true,
  };
}

function AdminProducts() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(createEmptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission("manage_products")) {
      navigate({ to: "/admin/unauthorized" });
    }
  }, [hasPermission, navigate]);

  useEffect(() => {
    void fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      const haystack = `${product.name_fr} ${product.name_ar} ${product.slug}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [products, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/products`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Impossible de charger les produits");
      setProducts(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setStatusMessage(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      name_fr: product.name_fr || "",
      name_ar: product.name_ar || "",
      description_fr: product.description_fr || "",
      description_ar: product.description_ar || "",
      price: String(product.price ?? 0),
      discount_pct: String(product.discount_pct ?? 0),
      stock: String(product.stock ?? 0),
      category_id: product.category_id || "",
      images: product.images || [],
      image_public_ids: product.image_public_ids || [],
      badge: product.badge || "",
      volume_ml: product.volume_ml ? String(product.volume_ml) : "",
      origin: product.origin || "",
      harvest_date: product.harvest_date || "",
      featured: Boolean(product.featured),
      active: Boolean(product.active),
    });
    setStatusMessage(null);
    setIsDialogOpen(true);
  };

  const handleFieldChange = (field: keyof ProductFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        ...form,
        price: Number(form.price || 0),
        discount_pct: Number(form.discount_pct || 0),
        stock: Number(form.stock || 0),
        volume_ml: form.volume_ml ? Number(form.volume_ml) : null,
        featured: Boolean(form.featured),
        active: Boolean(form.active),
        category_id: form.category_id || null,
        badge: form.badge || null,
      };

      const url = editingId ? `${API_BASE}/products/${editingId}` : `${API_BASE}/products`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Échec de l’enregistrement");

      const product = json.data as AdminProduct;
      setProducts((current) => {
        if (editingId) {
          return current.map((item) => (item.id === product.id ? product : item));
        }
        return [product, ...current];
      });
      setIsDialogOpen(false);
      setStatusMessage(editingId ? "Produit mis à jour" : "Produit créé");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Échec de l’enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Supprimer ce produit ?")) return;

    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Suppression impossible");
      setProducts((current) => current.filter((product) => product.id !== productId));
      setStatusMessage("Produit supprimé");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Suppression impossible");
    }
  };

  const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_BASE}/products/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Upload impossible");
      const upload = json.data as { url: string; public_id: string };
      setForm((current) => ({
        ...current,
        images: [...current.images, upload.url],
        image_public_ids: [...current.image_public_ids, upload.public_id],
      }));
      setStatusMessage("Image ajoutée");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
      image_public_ids: current.image_public_ids.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-olive-dark">
            Gestion des produits
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez, modifiez et gérez vos produits avec upload d’images.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      {statusMessage ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un produit"
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chargement des produits...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <Package className="h-10 w-10 text-muted-foreground/40" />
            <p>Aucun produit trouvé pour cette recherche.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name_fr} className="h-11 w-11 rounded-xl object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{product.name_fr}</p>
                    <p className="text-sm text-muted-foreground">{product.slug}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.price.toFixed(2)} DA • Stock {product.stock}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(product)}>
                    <Pencil className="h-4 w-4" />
                    Éditer
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le produit" : "Créer un produit"}</DialogTitle>
            <DialogDescription>
              Renseignez les informations du produit et ajoutez une ou plusieurs images.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom français</label>
                <Input
                  value={form.name_fr}
                  onChange={(event) => handleFieldChange("name_fr", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom arabe</label>
                <Input
                  value={form.name_ar}
                  onChange={(event) => handleFieldChange("name_ar", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prix (DA)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => handleFieldChange("price", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remise (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount_pct}
                  onChange={(event) => handleFieldChange("discount_pct", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => handleFieldChange("stock", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Catégorie</label>
                <Input
                  value={form.category_id}
                  onChange={(event) => handleFieldChange("category_id", event.target.value)}
                  placeholder="ID ou slug"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Volume (ml)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.volume_ml}
                  onChange={(event) => handleFieldChange("volume_ml", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Origine</label>
                <Input
                  value={form.origin}
                  onChange={(event) => handleFieldChange("origin", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Badge</label>
                <Input
                  value={form.badge}
                  onChange={(event) => handleFieldChange("badge", event.target.value)}
                  placeholder="Nouveau"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de récolte</label>
                <Input
                  value={form.harvest_date}
                  onChange={(event) => handleFieldChange("harvest_date", event.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description française</label>
              <Textarea
                value={form.description_fr}
                onChange={(event) => handleFieldChange("description_fr", event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description arabe</label>
              <Textarea
                value={form.description_ar}
                onChange={(event) => handleFieldChange("description_ar", event.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-3">
              <div>
                <p className="font-medium">Produit en vedette</p>
                <p className="text-sm text-muted-foreground">Afficher sur la page d’accueil.</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={(value) => handleFieldChange("featured", value)} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-3">
              <div>
                <p className="font-medium">Produit actif</p>
                <p className="text-sm text-muted-foreground">Visible par les clients.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(value) => handleFieldChange("active", value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Images</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/70 px-4 py-6 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                {isUploading ? "Téléversement en cours..." : "Ajouter une image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
              </label>
              {form.images.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {form.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative overflow-hidden rounded-xl border border-border">
                      <img src={image} alt={`${form.name_fr} ${index + 1}`} className="h-32 w-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Supprimer l'image ${index + 1}`}
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
