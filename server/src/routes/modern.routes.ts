import { Router } from "express";
import {
  createOrder,
  createProduct,
  createReview,
  deleteOrder,
  deleteProduct,
  deleteReview,
  getAllReviews,
  getComprehensiveAnalytics,
  getDashboardStats,
  getMe,
  getOrderById,
  getOrders,
  getProductAnalytics,
  getProductAnalyticsById,
  getProductBySlug,
  getProducts,
  getRevenueAnalytics,
  getOrdersAnalytics,
  getReviewsByProduct,
  health,
  loginAdmin,
  logout,
  updateAdminEmail,
  updateAdminPassword,
  updateAdminLanguage,
  updateUserEmail,
  updateUserPassword,
  updateOrderStatus,
  updateProduct,
  uploadProductImage,
  getUsersAdmin,
  createUserAdmin,
  updateUserAdmin,
  resetPasswordAdmin,
  deleteUserAdmin,
  toggleReviewVisibility,
  getContactSettings,
  updateContactSettings,
  getGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGallery,
} from "@server/controllers/modern.controller";
import { protect } from "@server/middlewares/auth.middleware";
import { restrictTo } from "@server/middlewares/admin.middleware";

const router = Router();

router.get("/health", health);
router.post("/auth/admin/login", loginAdmin);
router.post("/auth/logout", logout);
router.get("/auth/me", getMe);

// Contact Settings (public read, admin write)
router.get("/contact-settings", getContactSettings);
router.patch("/contact-settings", protect, restrictTo("admin"), updateContactSettings);

// Gallery (public read, admin write)
router.get("/gallery", getGallery);
router.post("/gallery", protect, restrictTo("admin"), createGalleryItem);
router.patch("/gallery/:id", protect, restrictTo("admin"), updateGalleryItem);
router.delete("/gallery/:id", protect, restrictTo("admin"), deleteGalleryItem);
router.post("/gallery/reorder", protect, restrictTo("admin"), reorderGallery);

// Dashboard
router.get("/dashboard/stats", protect, restrictTo("admin"), getDashboardStats);
router.get("/dashboard/analytics", protect, restrictTo("admin"), getComprehensiveAnalytics);
router.get("/dashboard/revenue", protect, restrictTo("admin"), getRevenueAnalytics);
router.get("/dashboard/orders", protect, restrictTo("admin"), getOrdersAnalytics);
router.get("/products/analytics", protect, restrictTo("admin"), getProductAnalytics);
router.get("/products/analytics/:id", protect, restrictTo("admin"), getProductAnalyticsById);

// Products
router.get("/products", getProducts);
router.post("/products", protect, restrictTo("admin"), createProduct);
router.post("/products/upload-image", protect, restrictTo("admin"), uploadProductImage);
router.get("/products/:slug", getProductBySlug);
router.patch("/products/:id", protect, restrictTo("admin"), updateProduct);
router.delete("/products/:id", protect, restrictTo("admin"), deleteProduct);
router.get("/products/analytics", protect, restrictTo("admin"), getProductAnalytics);

// Reviews
router.get("/products/:slug/reviews", getReviewsByProduct);
router.post("/products/:slug/reviews", createReview);
router.get("/reviews", protect, restrictTo("admin"), getAllReviews);
router.patch("/reviews/:id/visibility", protect, restrictTo("admin"), toggleReviewVisibility);
router.delete("/reviews/:id", protect, restrictTo("admin"), deleteReview);

// Orders
router.post("/orders", createOrder);
router.get("/orders", protect, getOrders);
router.get("/orders/:id", protect, getOrderById);
router.patch("/orders/:id/status", protect, restrictTo("admin"), updateOrderStatus);
router.delete("/orders/:id", protect, restrictTo("admin"), deleteOrder);

// Admin settings
router.patch("/admin/settings/email", protect, restrictTo("admin"), updateAdminEmail);
router.patch("/admin/settings/password", protect, restrictTo("admin"), updateAdminPassword);
router.patch("/admin/settings/language", protect, restrictTo("admin"), updateAdminLanguage);

// User (client) settings
router.patch("/account/email", protect, updateUserEmail);
router.patch("/account/password", protect, updateUserPassword);

// User Management (Admin)
router.get("/users", protect, restrictTo("admin"), getUsersAdmin);
router.post("/users", protect, restrictTo("admin"), createUserAdmin);
router.patch("/users/:id", protect, restrictTo("admin"), updateUserAdmin);
router.post("/users/:id/reset-password", protect, restrictTo("admin"), resetPasswordAdmin);
router.delete("/users/:id", protect, restrictTo("admin"), deleteUserAdmin);

export default router;
