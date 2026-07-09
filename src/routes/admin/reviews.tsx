import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Star,
  Search,
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    name_fr: string;
    name_ar: string;
    slug: string;
  };
}

const API_BASE = getApiBaseUrl();

function AdminReviews() {
  const { hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasPermission("manage_reviews")) {
      navigate({ to: "/admin/dashboard" as any });
    }
  }, [hasPermission, navigate]);

  const [search, setSearch] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-reviews", page, search, productIdFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);
      if (productIdFilter) params.append("productId", productIdFilter);

      const res = await fetch(`${API_BASE}/reviews?${params}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load reviews");
      const json = await res.json();
      return json.data;
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/reviews/${id}/visibility`, {
        method: "PATCH",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to toggle visibility");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Review visibility updated");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete review");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggleVisibility = (review: Review) => {
    toggleVisibilityMutation.mutate(review.id);
  };

  const handleDelete = (review: Review) => {
    if (confirm(`Are you sure you want to delete this review by ${review.customerName}?`)) {
      deleteMutation.mutate(review.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-olive-dark">
          Product Reviews
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage customer reviews and ratings
        </p>
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
            placeholder="Search by name or comment..."
            className="rounded-xl pl-9"
          />
        </div>
        <Input
          value={productIdFilter}
          onChange={(e) => {
            setProductIdFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by Product ID"
          className="rounded-xl sm:w-64"
        />
      </div>

      {/* Reviews table */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex py-16 justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !data?.reviews || data.reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Star className="h-10 w-10 opacity-40" />
            <p>No reviews found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.reviews.map((review: Review) => (
                  <tr key={review.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{review.customerName}</p>
                        <p className="text-xs text-muted-foreground">{review.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {review.product ? (
                        <span className="text-sm">{review.product.name_fr}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{review.productId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {review.comment}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          review.isVisible
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {review.isVisible ? (
                          <>
                            <Eye className="h-3 w-3" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> Hidden
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(review)}
                          className="h-8 w-8 rounded-full p-0"
                          title={review.isVisible ? "Hide" : "Show"}
                        >
                          {review.isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(review)}
                          className="h-8 w-8 rounded-full p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
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
            Total : {data.pagination.total} reviews
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
