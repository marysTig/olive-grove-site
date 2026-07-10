import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, User, Save, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ContactSettings } from "@/lib/types";

export const Route = createFileRoute("/admin/contact-settings")({
  component: AdminContactSettings,
});

function AdminContactSettings() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasPermission("manage_settings")) {
      navigate({ to: "/admin/dashboard" as any });
    }
  }, [hasPermission, navigate]);

  const [form, setForm] = useState({
    whatsappNumber: "",
    facebookUrl: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["contact-settings"],
    queryFn: async (): Promise<ContactSettings> => {
      const res = await fetch(`${getApiBaseUrl()}/contact-settings`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load contact settings");
      return json.data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        whatsappNumber: data.whatsappNumber || "",
        facebookUrl: data.facebookUrl || "",
        contactName: data.contactName || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const res = await fetch(`${getApiBaseUrl()}/contact-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update contact settings");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Contact settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["contact-settings"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
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
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">
          My Contacts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage contact information displayed on the public site
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="pl-9 rounded-xl"
                placeholder="Lem3ansra n Jeddi"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="whatsappNumber"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                className="pl-9 rounded-xl"
                placeholder="+213XXXXXXXXX"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for WhatsApp button on contact page
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="facebookUrl"
                value={form.facebookUrl}
                onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                className="pl-9 rounded-xl"
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-9 rounded-xl"
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="pl-9 rounded-xl"
                placeholder="+213XXXXXXXXX"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="pl-9 rounded-xl min-h-[100px]"
                placeholder="Full address..."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-full gap-2"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
