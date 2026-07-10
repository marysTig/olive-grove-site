import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Image as ImageIcon, Plus, Trash2, GripVertical, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { GalleryItem } from "@/lib/types";

export const Route = createFileRoute("/admin/gallery")({
  component: AdminGallery,
});

function AdminGallery() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasPermission("manage_settings")) {
      navigate({ to: "/admin/dashboard" as any });
    }
  }, [hasPermission, navigate]);

  const { data: gallery = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async (): Promise<GalleryItem[]> => {
      const res = await fetch(`${getApiBaseUrl()}/gallery`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load gallery");
      return json.data;
    },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${getApiBaseUrl()}/products/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");
      return json.data as { secure_url: string; public_id: string };
    },
    onSuccess: async (uploadData) => {
      try {
        // Create gallery item with uploaded image
        const res = await fetch(`${getApiBaseUrl()}/gallery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            imageUrl: uploadData.secure_url,
            imagePublicId: uploadData.public_id,
            title: "",
            description: "",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to create gallery item");
        
        queryClient.invalidateQueries({ queryKey: ["gallery"] });
        toast.success("Image added to gallery");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save image to gallery");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string }) => {
      const res = await fetch(`${getApiBaseUrl()}/gallery/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: data.title, description: data.description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Gallery item updated");
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getApiBaseUrl()}/gallery/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Gallery item deleted");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    e.target.value = "";
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setEditForm({ title: item.title, description: item.description });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    updateMutation.mutate({
      id: editingItem.id,
      title: editForm.title,
      description: editForm.description,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this image from gallery?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex py-16 justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-olive-dark">
            Gallery Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage "Notre Oliveraie" section images
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploadMutation.isPending}
          />
          <Button asChild disabled={uploadMutation.isPending} className="gap-2 cursor-pointer">
            <span>
              <Plus className="h-4 w-4" />
              {uploadMutation.isPending ? "Uploading..." : "Add Image"}
            </span>
          </Button>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-2xl overflow-hidden border border-border bg-card"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-48 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(item)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {gallery.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>No images in gallery yet. Add your first image!</p>
        </div>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Edit Image</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingItem(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Image title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Image description"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
