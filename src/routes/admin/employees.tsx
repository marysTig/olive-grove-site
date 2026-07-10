import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Key,
  Shield,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/employees")({
  component: AdminEmployees,
});

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

function AdminEmployees() {
  const { user: currentAdmin, hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if insufficient permissions
  useEffect(() => {
    if (!hasPermission("manage_employees")) {
      navigate({ to: "/admin/unauthorized" });
    }
  }, [hasPermission, navigate]);

  // States for search, filter, pagination, and modals
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  // Dialog / Modal Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");

  // Fetch Users Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("isActive", statusFilter);

      const res = await fetch(`${getApiBaseUrl()}/users?${params}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();
      return json.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create user");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Compte utilisateur créé avec succès !");
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<User>) => {
      if (!selectedUser) return;
      const res = await fetch(`${getApiBaseUrl()}/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update user");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Utilisateur mis à jour !");
      setIsEditOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      const res = await fetch(`${getApiBaseUrl()}/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to reset password");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Mot de passe réinitialisé !");
      setIsPasswordOpen(false);
      setPassword("");
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getApiBaseUrl()}/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete user");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Utilisateur supprimé !");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("client");
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setIsEditOpen(true);
  };

  const openPasswordReset = (user: User) => {
    setSelectedUser(user);
    setPassword("");
    setIsPasswordOpen(true);
  };

  const handleDelete = (user: User) => {
    if (user.id === currentAdmin?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte !");
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.fullName} ?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const toggleUserStatus = (user: User) => {
    if (user.id === currentAdmin?.id) {
      toast.error("Vous ne pouvez pas désactiver votre propre compte !");
      return;
    }
    setSelectedUser(user);
    updateMutation.mutate({ isActive: !user.isActive });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-olive-dark">
            Gestion des utilisateurs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les comptes administratifs, les employés et les clients.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouvel Utilisateur
        </Button>
      </div>

      {/* Filters & search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par nom ou email..."
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Filtrer par rôle"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Administrateur</option>
            <option value="employee">Employé/Client</option>
          </select>
          <select
            aria-label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex py-16 justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !data?.users || data.users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Users className="h-10 w-10 opacity-40" />
            <p>Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                  <th className="px-6 py-4">Nom Complet</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Dernière Connexion</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.users.map((u: User) => (
                  <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{u.fullName}</td>
                    <td className="px-6 py-4 text-muted-foreground" dir="ltr">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/20 text-secondary-foreground"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {u.role === "admin" ? "Admin" : "Client"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        disabled={u.id === currentAdmin?.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                      >
                        {u.isActive ? (
                          <>
                            <UserCheck className="h-3 w-3" /> Actif
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" /> Inactif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Jamais"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(u)}
                          className="h-8 w-8 rounded-full p-0"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPasswordReset(u)}
                          className="h-8 w-8 rounded-full p-0"
                          title="Réinitialiser le mot de passe"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={u.id === currentAdmin?.id}
                          onClick={() => handleDelete(u)}
                          className="h-8 w-8 rounded-full p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Total : {data.pagination.total} utilisateurs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full"
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ──────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <h2 className="font-display text-lg font-bold text-olive-dark mb-4">
              Créer un nouvel utilisateur
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Nom Complet</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Adresse email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mot de passe</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Rôle</label>
                <select
                  aria-label="Sélectionner un rôle"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  <option value="client">Client</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full"
                >
                  Annuler
                </Button>
                <Button type="submit" className="rounded-full">
                  Créer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ────────────────────────────────────── */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <h2 className="font-display text-lg font-bold text-olive-dark mb-4">
              Modifier l'utilisateur
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ fullName, email, role });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Nom Complet</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Adresse email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Rôle</label>
                <select
                  aria-label="Sélectionner un rôle"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={selectedUser?.id === currentAdmin?.id}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="client">Client</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-full"
                >
                  Annuler
                </Button>
                <Button type="submit" className="rounded-full">
                  Sauvegarder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ───────────────────────────────── */}
      {isPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <h2 className="font-display text-lg font-bold text-olive-dark mb-4">
              Réinitialiser le mot de passe de {selectedUser?.fullName}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetPasswordMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nouveau mot de passe
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 caractères"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPasswordOpen(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-full"
                >
                  Annuler
                </Button>
                <Button type="submit" className="rounded-full">
                  Réinitialiser
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
