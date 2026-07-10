import { Request, Response, NextFunction } from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import { asyncHandler } from "@server/utils/asyncHandler";
import { ApiError } from "@server/utils/ApiError";
import { ApiResponse } from "@server/utils/ApiResponse";
import { env, isCloudinaryConfigured } from "@server/config/env.config";
import { AuthService } from "@server/services/auth.service";
import { supabase } from "@server/database/supabase";
import { assertSupabaseSchemaReady } from "@server/utils/schema-check";
import {
  computeProductStatus,
  fetchOrderItems,
  getUserRole,
  setUserRole,
  toApiRole,
  toDbRole,
  type OrderItemRow,
} from "@server/utils/db-helpers";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role: string;
    fullName: string;
    email: string;
  };
};

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

function normalizeProductPayload(body: Record<string, unknown>) {
  const name_fr = typeof body.name_fr === "string" ? body.name_fr.trim() : "";
  const name_ar = typeof body.name_ar === "string" ? body.name_ar.trim() : "";
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : name_fr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
  const stock = Number(body.quantity ?? body.stock ?? 0);
  return {
    name_fr,
    name_ar,
    slug,
    description_fr: typeof body.description_fr === "string" ? body.description_fr.trim() : "",
    description_ar: typeof body.description_ar === "string" ? body.description_ar.trim() : "",
    price: Number(body.price ?? 0),
    discount_pct: Number(body.discount_pct ?? 0),
    stock,
    category_id: typeof body.category_id === "string" ? body.category_id : null,
    images: Array.isArray(body.images)
      ? body.images.filter((item): item is string => typeof item === "string")
      : [],
    image_public_ids: Array.isArray(body.image_public_ids)
      ? body.image_public_ids.filter((item): item is string => typeof item === "string")
      : [],
    badge: typeof body.badge === "string" && body.badge.trim() ? body.badge.trim() : null,
    volume_ml:
      body.volume_ml === null || body.volume_ml === undefined ? null : Number(body.volume_ml),
    origin: typeof body.origin === "string" && body.origin.trim() ? body.origin.trim() : null,
    harvest_date:
      typeof body.harvest_date === "string" && body.harvest_date.trim()
        ? body.harvest_date.trim()
        : null,
    featured: body.featured === true || body.featured === "true",
    active: body.active === false || body.active === "false" ? false : body.active !== false,
  };
}

function buildProductResponse(product: Record<string, unknown>) {
  const productId = typeof product.id === "string" ? product.id : "";
  const stock = Number(product.stock ?? product.quantity ?? 0);
  const harvestDate = product.harvest_date ?? product.harvestDate;
  const createdAt = product.created_at ?? product.createdAt;
  const updatedAt = product.updated_at ?? product.updatedAt;

  return {
    id: productId,
    name_fr: (product.name_fr as string) ?? "",
    name_ar: (product.name_ar as string) ?? "",
    slug: (product.slug as string) ?? "",
    description_fr: (product.description_fr as string) ?? "",
    description_ar: (product.description_ar as string) ?? "",
    price: Number(product.price ?? 0),
    discount_pct: Number(product.discount_pct ?? 0),
    quantity: stock,
    status: computeProductStatus(stock),
    category_id: (product.category_id as string | null) ?? null,
    images: (product.images as string[]) ?? [],
    image_public_ids: (product.image_public_ids as string[]) ?? [],
    badge: (product.badge as string | null) ?? null,
    volume_ml: (product.volume_ml as number | null) ?? null,
    origin: (product.origin as string | null) ?? null,
    harvest_date: harvestDate
      ? harvestDate instanceof Date
        ? harvestDate.toISOString()
        : String(harvestDate)
      : null,
    featured: Boolean(product.featured ?? false),
    active: Boolean(product.active ?? true),
    created_at:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : String(createdAt ?? new Date().toISOString()),
    updated_at:
      updatedAt instanceof Date
        ? updatedAt.toISOString()
        : String(updatedAt ?? new Date().toISOString()),
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : String(createdAt ?? new Date().toISOString()),
    updatedAt:
      updatedAt instanceof Date
        ? updatedAt.toISOString()
        : String(updatedAt ?? new Date().toISOString()),
  };
}


export function normalizeOrderPayload(body: Record<string, unknown>) {
  const items = Array.isArray(body.items) ? body.items : [];
  return {
    customerName: typeof body.customer_name === "string" ? body.customer_name.trim() : "",
    customerEmail: typeof body.customer_email === "string" ? body.customer_email.trim() : null,
    customerPhone: typeof body.customer_phone === "string" ? body.customer_phone.trim() : "",
    deliveryAddress: typeof body.delivery_address === "string" ? body.delivery_address.trim() : "",
    wilaya: typeof body.wilaya === "string" ? body.wilaya.trim() : "",
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    couponCode:
      typeof body.coupon_code === "string" && body.coupon_code.trim()
        ? body.coupon_code.trim().toUpperCase()
        : null,
    subtotal: Number(body.subtotal ?? 0),
    discount: Number(body.discount ?? 0),
    shippingFee: Number(body.shipping_fee ?? 0),
    total: Number(body.total ?? 0),
    items: items.map((item) => ({
      productId: typeof item?.id === "string" ? item.id : null,
      nameAr: typeof item?.name_ar === "string" ? item.name_ar : "",
      nameFr: typeof item?.name_fr === "string" ? item.name_fr : "",
      quantity: Number(item?.quantity ?? 1),
      price: Number(item?.price ?? 0),
      imageUrl: typeof item?.image_url === "string" ? item.image_url : null,
    })),
  };
}

function mapOrderItems(items: OrderItemRow[] | Array<Record<string, unknown>>) {
  return items.map((item) => ({
    product_id: (item as OrderItemRow).product_id ?? item.productId ?? item.product_id ?? null,
    name_ar: (item as OrderItemRow).name_ar ?? item.nameAr ?? item.name_ar ?? "",
    name_fr: (item as OrderItemRow).name_fr ?? item.nameFr ?? item.name_fr ?? "",
    quantity: Number((item as OrderItemRow).quantity ?? item.quantity ?? 0),
    price: Number((item as OrderItemRow).price ?? item.price ?? 0),
    image_url: (item as OrderItemRow).image_url ?? item.imageUrl ?? item.image_url ?? null,
  }));
}

function buildOrderResponse(
  order: Record<string, unknown>,
  items: OrderItemRow[] | Array<Record<string, unknown>> = [],
) {
  const normalizedOrder = order;
  const createdAt =
    normalizedOrder.created_at instanceof Date
      ? normalizedOrder.created_at.toISOString()
      : typeof normalizedOrder.created_at === "string"
        ? normalizedOrder.created_at
        : new Date().toISOString();

  const mappedItems = mapOrderItems(items.length > 0 ? items : (normalizedOrder.items as Array<Record<string, unknown>>) ?? []);

  return {
    id: normalizedOrder.id ?? "",
    order_number: normalizedOrder.order_number ?? normalizedOrder.orderNumber ?? 0,
    user_id: normalizedOrder.user_id ?? normalizedOrder.userId ?? null,
    status: normalizedOrder.status ?? "pending",
    payment_method:
      normalizedOrder.payment_method ?? normalizedOrder.paymentMethod ?? "cash_on_delivery",
    customer_name: normalizedOrder.customer_name ?? normalizedOrder.customerName ?? "",
    customer_email: normalizedOrder.customer_email ?? normalizedOrder.customerEmail ?? null,
    customer_phone:
      normalizedOrder.customer_phone ??
      normalizedOrder.customerPhone ??
      normalizedOrder.phone ??
      "",
    delivery_address:
      normalizedOrder.delivery_address ??
      normalizedOrder.deliveryAddress ??
      normalizedOrder.address ??
      "",
    phone:
      normalizedOrder.customer_phone ??
      normalizedOrder.customerPhone ??
      normalizedOrder.phone ??
      "",
    address:
      normalizedOrder.delivery_address ??
      normalizedOrder.deliveryAddress ??
      normalizedOrder.address ??
      "",
    wilaya: normalizedOrder.wilaya ?? "",
    notes: normalizedOrder.notes ?? null,
    coupon_code: normalizedOrder.coupon_code ?? normalizedOrder.couponCode ?? null,
    subtotal: Number(normalizedOrder.subtotal ?? 0),
    shipping_fee: Number(normalizedOrder.shipping_fee ?? normalizedOrder.shippingFee ?? 0),
    discount: Number(normalizedOrder.discount ?? 0),
    total: Number(normalizedOrder.total ?? 0),
    products: mappedItems,
    items: mappedItems,
    inventory_deducted: Boolean(
      normalizedOrder.inventory_deducted ?? normalizedOrder.inventoryDeducted ?? false,
    ),
    created_at: createdAt,
    createdAt,
  };
}

function buildReviewResponse(review: Record<string, unknown>) {
  return {
    id: String(review.id ?? ""),
    productId: String(review.product_id ?? review.productId ?? ""),
    userId: review.user_id ?? review.userId ?? null,
    customerName: String(review.customer_name ?? review.customerName ?? ""),
    customerEmail: String(review.customer_email ?? review.customerEmail ?? ""),
    rating: Number(review.rating ?? 5),
    comment: String(review.comment ?? ""),
    isVisible: Boolean(review.is_visible ?? review.isVisible ?? true),
    createdAt: String(review.created_at ?? review.createdAt ?? new Date().toISOString()),
    updatedAt: String(review.updated_at ?? review.updatedAt ?? new Date().toISOString()),
  };
}

async function buildOrdersWithItems(orders: Array<Record<string, unknown>>) {
  const itemsMap = await fetchOrderItems(orders.map((o) => String(o.id)));
  return orders.map((order) => buildOrderResponse(order, itemsMap.get(String(order.id)) ?? []));
}

async function listAuthUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw ApiError.internal("Failed to fetch users");
  return data.users;
}

export const health = asyncHandler(async (_req: Request, res: Response) => {
  try {
    await assertSupabaseSchemaReady();
    ApiResponse.success(res, { status: "healthy", store: "supabase" }, "Server is running");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Schema validation failed";
    throw ApiError.serviceUnavailable(message);
  }
});

export const getProducts = asyncHandler(async (_req: Request, res: Response) => {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw ApiError.internal("Failed to fetch products");
  }

  ApiResponse.success(res, products.map(buildProductResponse), "Products fetched successfully");
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", req.params.slug)
    .single();

  if (error || !product) {
    throw ApiError.notFound("Product not found");
  }
  ApiResponse.success(res, buildProductResponse(product), "Product fetched successfully");
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const payload = normalizeProductPayload(req.body as Record<string, unknown>);
  
  // Check if slug exists
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", payload.slug)
    .single();

  if (existing) {
    payload.slug = `${payload.slug}-${Date.now()}`;
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert(payload)
    .select()
    .single();

  if (error || !product) {
    throw ApiError.internal("Failed to create product");
  }

  ApiResponse.created(
    res,
    buildProductResponse(product),
    "Product created successfully",
  );
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !product) {
    throw ApiError.notFound("Product not found");
  }

  const payload = normalizeProductPayload(req.body as Record<string, unknown>);
  
  if (payload.slug && payload.slug !== product.slug) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", payload.slug)
      .neq("id", product.id)
      .single();

    if (existing) {
      payload.slug = `${payload.slug}-${Date.now()}`;
    }
  }

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update(payload)
    .eq("id", product.id)
    .select()
    .single();

  if (updateError || !updatedProduct) {
    throw ApiError.internal("Failed to update product");
  }

  ApiResponse.success(
    res,
    buildProductResponse(updatedProduct),
    "Product updated successfully",
  );
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("image_public_ids")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !product) {
    throw ApiError.notFound("Product not found");
  }

  // Delete images from Cloudinary
  for (const publicId of product.image_public_ids ?? []) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // Ignore cleanup errors
    }
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", req.params.id);

  if (deleteError) {
    throw ApiError.internal("Failed to delete product");
  }

  ApiResponse.success(res, null, "Product deleted successfully");
});

const runImageUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    return next();
  }
  upload.single("image")(req, res, (error) => {
    if (error) {
      return next(error);
    }
    next();
  });
};

export const uploadProductImage = [
  runImageUploadMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest("No image file provided");
    }

    if (!isCloudinaryConfigured()) {
      throw ApiError.serviceUnavailable(
        "Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      );
    }

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: env.CLOUDINARY_FOLDER || "olive-grove-emporium/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed"));
            } else {
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
          },
        );
        streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
      },
    ).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Cloudinary upload failed";
      throw ApiError.internal(`Image upload failed: ${message}`);
    });

    ApiResponse.success(res, uploadResult, "Image uploaded successfully");
  }),
];

export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const { user, session } = await AuthService.login(email || "", password || "");

  if (user.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access the admin panel.");
  }

  AuthService.setSessionCookies(res, session);
  ApiResponse.success(res, { user }, "Admin login successful");
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  AuthService.clearSessionCookies(res);
  ApiResponse.success(res, null, "Logged out successfully");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const token = AuthService.extractTokenFromRequest(req);
  if (!token) {
    throw ApiError.unauthorized("Not authenticated");
  }

  const user = await AuthService.verifyAccessToken(token);
  ApiResponse.success(res, { user }, "Authenticated");
});

export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access dashboard stats");
  }

  const [{ data: allOrders }, { count: productCount }, authUsers] = await Promise.all([
    supabase.from("orders").select("*"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    listAuthUsers(),
  ]);

  const orders = allOrders ?? [];
  const itemsMap = await fetchOrderItems(orders.map((o) => String(o.id)));
  const customerCount = (
    await Promise.all(authUsers.map((u) => getUserRole(u.id)))
  ).filter((role) => role === "customer").length;

  const revenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const orderStatusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const daysParam = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  const days = isNaN(daysParam) ? 30 : daysParam;

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const revenueByDayMap = new Map<string, Record<string, number>>();
  const allProductNames = new Set<string>();

  for (const o of orders) {
    if (o.status === "delivered" && (days === 0 || new Date(o.created_at) >= fromDate)) {
      const day = o.created_at.slice(0, 10);
      if (!revenueByDayMap.has(day)) revenueByDayMap.set(day, {});
      const dayData = revenueByDayMap.get(day)!;
      const items = itemsMap.get(String(o.id)) ?? [];

      for (const item of items) {
        const productName = String(item.name_fr || item.name_ar || "Unknown");
        allProductNames.add(productName);
        const itemRev = Number(item.price || 0) * Number(item.quantity || 1);
        dayData[productName] = (dayData[productName] || 0) + itemRev;
      }
    }
  }

  const revenueByDay = Array.from(revenueByDayMap.entries())
    .map(([day, productRevenues]) => ({
      _id: day,
      ...productRevenues,
    }))
    .sort((a, b) => a._id.localeCompare(b._id));

  ApiResponse.success(
    res,
    {
      products: productCount ?? 0,
      orders: orders.length,
      pendingOrders: orderStatusCounts.pending || 0,
      deliveredOrders: orderStatusCounts.delivered || 0,
      revenue,
      customers: customerCount,
      revenueByDay,
      productNames: Array.from(allProductNames),
    },
    "Dashboard stats fetched successfully",
  );
});

// Update admin language
export const updateAdminLanguage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can update their language");
  }

  const { language } = req.body;

  if (!language || !["fr", "ar"].includes(language)) {
    throw ApiError.badRequest("Language must be either 'fr' or 'ar'");
  }

  await supabase.from("profiles").update({ language }).eq("id", req.user.id);

  ApiResponse.success(res, { language }, "Language updated successfully");
});

// User Management (Admin)
export const getUsersAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can access user management");

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  const roleFilter = typeof req.query.role === "string" ? req.query.role : undefined;
  const isActiveFilter =
    req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

  const authUsers = await listAuthUsers();
  const { data: profiles } = await supabase.from("profiles").select("id,name,is_active,created_at");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let users = await Promise.all(
    authUsers.map(async (authUser) => {
      const profile = profileMap.get(authUser.id);
      const role = await getUserRole(authUser.id);
      return {
        id: authUser.id,
        fullName: profile?.name ?? authUser.user_metadata?.name ?? authUser.email ?? "",
        email: authUser.email ?? "",
        role: toApiRole(role),
        isActive: profile?.is_active ?? true,
        createdAt: profile?.created_at ?? authUser.created_at,
        lastLogin: authUser.last_sign_in_at ?? null,
      };
    }),
  );

  if (search) {
    users = users.filter(
      (u) => u.fullName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search),
    );
  }
  if (roleFilter) users = users.filter((u) => u.role === roleFilter);
  if (isActiveFilter !== undefined) users = users.filter((u) => u.isActive === isActiveFilter);

  const total = users.length;
  const paginated = users.slice((page - 1) * limit, page * limit);

  ApiResponse.success(
    res,
    {
      users: paginated,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
    "Users retrieved successfully",
  );
});

export const createUserAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can create users");

  const { fullName, email, password, role } = req.body as {
    fullName?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!fullName || !email || !password) {
    throw ApiError.badRequest("Full name, email, and password are required");
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
    user_metadata: { name: fullName },
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("already")) {
      throw ApiError.conflict("Email address is already in use");
    }
    throw ApiError.internal(error?.message || "Failed to create user");
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    name: fullName,
    is_active: true,
    language: "fr",
  });
  await setUserRole(data.user.id, toDbRole(role));

  ApiResponse.success(
    res,
    {
      user: {
        id: data.user.id,
        fullName,
        email: data.user.email,
        role: toApiRole(toDbRole(role)),
        isActive: true,
      },
    },
    "User created successfully",
  );
});

export const updateUserAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can update users");

  const { fullName, email, role, isActive } = req.body as {
    fullName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  };
  const { id } = req.params;

  const existingUser = await AuthService.getUserById(id);
  if (!existingUser) throw ApiError.notFound("User not found");
  if (isActive === false && req.user?.id === id) {
    throw ApiError.badRequest("You cannot deactivate your own account");
  }
  if (role !== undefined && role !== existingUser.role && req.user?.id === id) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  if (email && email !== existingUser.email) {
    const { error } = await supabase.auth.admin.updateUserById(id, { email });
    if (error) throw ApiError.conflict(error.message);
  }

  const profilePayload: Record<string, unknown> = {};
  if (fullName !== undefined) profilePayload.name = fullName;
  if (isActive !== undefined) profilePayload.is_active = isActive;
  if (Object.keys(profilePayload).length > 0) {
    await supabase.from("profiles").update(profilePayload).eq("id", id);
  }

  if (role !== undefined) {
    await setUserRole(id, toDbRole(role));
  }

  const updated = await AuthService.getUserById(id);
  ApiResponse.success(res, { user: updated }, "User updated successfully");
});

export const resetPasswordAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can reset passwords");
  const { password } = req.body as { password?: string };
  const { id } = req.params;

  if (!password) throw ApiError.badRequest("Password is required");

  const existingUser = await AuthService.getUserById(id);
  if (!existingUser) throw ApiError.notFound("User not found");

  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) throw ApiError.internal(error.message);

  ApiResponse.success(res, null, "User password reset successfully");
});

export const deleteUserAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can delete users");
  const { id } = req.params;
  if (req.user?.id === id) {
    throw ApiError.badRequest("You cannot delete your own administrative account");
  }

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw ApiError.notFound("User not found");

  ApiResponse.success(res, null, "User deleted successfully");
});

export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = normalizeOrderPayload(req.body as Record<string, unknown>);

  if (
    !payload.customerName ||
    !payload.customerPhone ||
    !payload.deliveryAddress ||
    !payload.wilaya
  ) {
    throw ApiError.badRequest("Missing required checkout fields");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: req.user?.id ?? null,
      payment_method: "cod",
      status: "pending",
      customer_name: payload.customerName,
      customer_email: payload.customerEmail,
      customer_phone: payload.customerPhone,
      phone: payload.customerPhone,
      address: payload.deliveryAddress,
      delivery_address: payload.deliveryAddress,
      wilaya: payload.wilaya,
      notes: payload.notes,
      coupon_code: payload.couponCode,
      subtotal: payload.subtotal,
      discount: payload.discount,
      shipping_fee: payload.shippingFee,
      total: payload.total,
    })
    .select()
    .single();

  if (error || !order) {
    throw ApiError.internal(error?.message || "Failed to create order");
  }

  if (payload.items.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      payload.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        name_ar: item.nameAr,
        name_fr: item.nameFr,
        quantity: item.quantity,
        price: item.price,
        image_url: item.imageUrl,
      })),
    );

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw ApiError.internal("Failed to create order items");
    }
  }

  const itemsMap = await fetchOrderItems([order.id]);
  ApiResponse.created(
    res,
    buildOrderResponse(order, itemsMap.get(order.id) ?? []),
    "Order created successfully",
  );
});

export const getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.user?.role === "admin";
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (!isAdmin && req.user?.id) {
    query = query.eq("user_id", req.user.id);
  }
  const { data: orders, error } = await query;
  if (error) throw ApiError.internal("Failed to fetch orders");
  const withItems = await buildOrdersWithItems((orders ?? []) as Array<Record<string, unknown>>);
  ApiResponse.success(res, withItems, "Orders fetched successfully");
});

export const getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.user?.role === "admin";
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error || !order) throw ApiError.notFound("Order not found");
  if (!isAdmin && order.user_id !== req.user?.id) {
    throw ApiError.forbidden("You are not authorized to view this order");
  }
  const itemsMap = await fetchOrderItems([order.id]);
  ApiResponse.success(
    res,
    buildOrderResponse(order, itemsMap.get(order.id) ?? []),
    "Order fetched successfully",
  );
});

export const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can update order status");
  }

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (fetchErr || !order) throw ApiError.notFound("Order not found");

  const newStatus = typeof req.body?.status === "string" ? req.body.status : "pending";
  const oldStatus = order.status;
  const itemsMap = await fetchOrderItems([order.id]);
  const orderItems = itemsMap.get(order.id) ?? [];

  if (oldStatus !== "shipped" && newStatus === "shipped" && !order.inventory_deducted) {
    for (const item of orderItems) {
      const productId = item.product_id;
      if (productId) {
        const { data: product } = await supabase
          .from("products")
          .select("id,name_fr,stock")
          .eq("id", productId)
          .single();
        if (!product) throw ApiError.badRequest(`Product ${productId} not found`);
        if ((product.stock as number) < Number(item.quantity)) {
          throw ApiError.badRequest(`Insufficient stock for ${product.name_fr}`);
        }
      }
    }
    for (const item of orderItems) {
      const productId = item.product_id;
      if (productId) {
        const { data: p } = await supabase.from("products").select("stock").eq("id", productId).single();
        if (p) {
          await supabase
            .from("products")
            .update({ stock: (p.stock as number) - Number(item.quantity) })
            .eq("id", productId);
        }
      }
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      inventory_deducted: newStatus === "shipped" ? true : order.inventory_deducted,
    })
    .eq("id", req.params.id)
    .select()
    .single();
  if (updateErr || !updated) throw ApiError.internal("Failed to update order status");

  ApiResponse.success(
    res,
    buildOrderResponse(updated, orderItems),
    "Order status updated successfully",
  );
});

export const deleteOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can delete orders");
  }

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (fetchErr || !order) throw ApiError.notFound("Order not found");

  if (order.inventory_deducted) {
    const itemsMap = await fetchOrderItems([order.id]);
    const orderItems = itemsMap.get(order.id) ?? [];
    for (const item of orderItems) {
      const productId = item.product_id;
      if (productId) {
        const { data: p } = await supabase.from("products").select("stock").eq("id", productId).single();
        if (p) {
          await supabase
            .from("products")
            .update({ stock: (p.stock as number) + Number(item.quantity) })
            .eq("id", productId);
        }
      }
    }
  }

  await supabase.from("order_items").delete().eq("order_id", order.id);
  await supabase.from("orders").delete().eq("id", req.params.id);
  ApiResponse.success(res, null, "Order deleted successfully");
});

// Analytics endpoints
export const getProductAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access product analytics");
  }

  const { data: productsData } = await supabase.from("products").select("*");
  const products = productsData ?? [];
  const { data: deliveredOrdersData } = await supabase.from("orders").select("*").eq("status", "delivered");
  const deliveredOrders = deliveredOrdersData ?? [];
  const deliveredItemsMap = await fetchOrderItems(deliveredOrders.map((o) => String(o.id)));

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const productSales = products.map((product) => {
    const productId = String(product.id);
    let soldToday = 0;
    let sold7d = 0;
    let sold30d = 0;
    let sold365d = 0;
    let soldTotal = 0;
    let revenue = 0;

    const monthlySales = new Map<string, number>();

    for (const order of deliveredOrders) {
      const orderItems = deliveredItemsMap.get(String(order.id)) ?? [];
      for (const item of orderItems) {
        const itemProductId = String(item.product_id ?? "");
        if (itemProductId === productId) {
          const qty = Number(item.quantity ?? 0);
          const price = Number(item.price ?? 0);
          revenue += qty * price;
          soldTotal += qty;

          const orderDate = new Date(order.created_at);
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
          monthlySales.set(monthKey, (monthlySales.get(monthKey) || 0) + qty);

          if (orderDate >= startOfToday) soldToday += qty;
          if (orderDate >= sevenDaysAgo) sold7d += qty;
          if (orderDate >= thirtyDaysAgo) sold30d += qty;
          if (orderDate >= oneYearAgo) sold365d += qty;
        }
      }
    }

    const numMonthsWithSales = monthlySales.size;
    const avgUnitsPerMonth = numMonthsWithSales > 0 ? soldTotal / numMonthsWithSales : 0;

    return {
      ...buildProductResponse(product as any),
      sold_today: soldToday,
      sold_7d: sold7d,
      sold_30d: sold30d,
      sold_365d: sold365d,
      sold_total: soldTotal,
      revenue,
      avg_units_per_month: avgUnitsPerMonth,
    };
  });

  ApiResponse.success(res, productSales, "Product analytics fetched successfully");
});

export const getProductAnalyticsById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access product analytics");
  }

  const { data: product, error: prodErr } = await supabase.from("products").select("*").eq("id", req.params.id).single();
  if (prodErr || !product) throw ApiError.notFound("Product not found");

  const productId = String(product.id);

  const { data: deliveredOrdersData } = await supabase.from("orders").select("*").eq("status", "delivered");
  const deliveredOrders = deliveredOrdersData ?? [];
  const deliveredItemsMap = await fetchOrderItems(deliveredOrders.map((o) => String(o.id)));

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  let soldToday = 0;
  let sold7d = 0;
  let sold30d = 0;
  let sold365d = 0;
  let soldTotal = 0;
  let revenueTotal = 0;
  let revenueToday = 0;
  let revenue7d = 0;
  let revenue30d = 0;
  let revenue365d = 0;

  const dailySalesMap = new Map<string, { units: number; revenue: number }>();
  const weeklySalesMap = new Map<string, { units: number; revenue: number }>();
  const monthlySalesMap = new Map<string, { units: number; revenue: number }>();
  const yearlySalesMap = new Map<string, { units: number; revenue: number }>();

  for (const order of deliveredOrders) {
    const orderItems = deliveredItemsMap.get(String(order.id)) ?? [];
    for (const item of orderItems) {
      const itemProductId = String(item.product_id ?? "");
      if (itemProductId === productId) {
        const qty = Number(item.quantity ?? 0);
        const price = Number(item.price ?? 0);
        const itemRevenue = qty * price;
        const orderDate = new Date(order.created_at);

        // Accumulate totals
        soldTotal += qty;
        revenueTotal += itemRevenue;

        const dayKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;
        const weekKey = `${orderDate.getFullYear()}-W${Math.ceil((orderDate.getDate() + new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).getDay()) / 7)}`;
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
        const yearKey = `${orderDate.getFullYear()}`;

        const updateMapEntry = (map: Map<string, { units: number; revenue: number }>, key: string, qty: number, rev: number) => {
          const entry = map.get(key) || { units: 0, revenue: 0 };
          map.set(key, { units: entry.units + qty, revenue: entry.revenue + rev });
        };

        updateMapEntry(dailySalesMap, dayKey, qty, itemRevenue);
        updateMapEntry(weeklySalesMap, weekKey, qty, itemRevenue);
        updateMapEntry(monthlySalesMap, monthKey, qty, itemRevenue);
        updateMapEntry(yearlySalesMap, yearKey, qty, itemRevenue);

        if (orderDate >= startOfToday) {
          soldToday += qty;
          revenueToday += itemRevenue;
        }
        if (orderDate >= sevenDaysAgo) {
          sold7d += qty;
          revenue7d += itemRevenue;
        }
        if (orderDate >= thirtyDaysAgo) {
          sold30d += qty;
          revenue30d += itemRevenue;
        }
        if (orderDate >= oneYearAgo) {
          sold365d += qty;
          revenue365d += itemRevenue;
        }
      }
    }
  }

  const mapToArray = (map: Map<string, { units: number; revenue: number }>, keyName: string) => {
    return Array.from(map.entries()).map(([key, value]) => ({ [keyName]: key, units: value.units, revenue: value.revenue })).sort((a, b) => a[keyName] > b[keyName] ? 1 : -1);
  };

  const dailySales = Array.from(dailySalesMap.entries()).map(([key, value]) => ({ date: key, units: value.units, revenue: value.revenue })).sort((a, b) => a.date.localeCompare(b.date));
  const weeklySales = Array.from(weeklySalesMap.entries()).map(([key, value]) => ({ week: key, units: value.units, revenue: value.revenue })).sort((a, b) => a.week.localeCompare(b.week));
  const monthlySales = Array.from(monthlySalesMap.entries()).map(([key, value]) => ({ month: key, units: value.units, revenue: value.revenue })).sort((a, b) => a.month.localeCompare(b.month));
  const yearlySales = Array.from(yearlySalesMap.entries()).map(([key, value]) => ({ year: key, units: value.units, revenue: value.revenue })).sort((a, b) => a.year.localeCompare(b.year));

  const stock = Number(product.stock ?? 0);
  const avgDailySalesLast30Days = sold30d / 30;
  const estimatedDaysOutOfStock =
    avgDailySalesLast30Days > 0 ? Math.ceil(stock / avgDailySalesLast30Days) : Infinity;

  ApiResponse.success(res, {
    product: buildProductResponse(product as Record<string, unknown>),
    sales: {
      sold_today: soldToday,
      sold_7d: sold7d,
      sold_30d: sold30d,
      sold_365d: sold365d,
      sold_total: soldTotal,
      revenue_today: revenueToday,
      revenue_7d: revenue7d,
      revenue_30d: revenue30d,
      revenue_365d: revenue365d,
      revenue_total: revenueTotal,
    },
    trends: {
      daily_sales: dailySales,
      weekly_sales: weeklySales,
      monthly_sales: monthlySales,
      yearly_sales: yearlySales,
    },
    inventory: {
      current_stock: stock,
      remaining_percentage: 100,
      status: computeProductStatus(stock),
      estimated_days_out_of_stock: estimatedDaysOutOfStock,
    },
  }, "Product analytics fetched successfully");
});

export const getRevenueAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access analytics");
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const { data: deliveredOrdersData } = await supabase.from("orders").select("total,created_at").eq("status", "delivered");
  const deliveredOrders = deliveredOrdersData ?? [];

  let revenueToday = 0;
  let revenue7d = 0;
  let revenue30d = 0;
  let revenue365d = 0;
  let revenueTotal = 0;

  const revenueByMonth = new Map<string, number>();

  for (const order of deliveredOrders) {
    const orderDate = new Date(order.created_at);
    const orderTotal = Number(order.total) || 0;
    revenueTotal += orderTotal;

    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + orderTotal);

    if (orderDate >= startOfToday) revenueToday += orderTotal;
    if (orderDate >= sevenDaysAgo) revenue7d += orderTotal;
    if (orderDate >= thirtyDaysAgo) revenue30d += orderTotal;
    if (orderDate >= oneYearAgo) revenue365d += orderTotal;
  }

  // Find best revenue month
  let bestRevenueMonth = "";
  let bestRevenue = 0;

  for (const [month, revenue] of revenueByMonth) {
    if (revenue > bestRevenue) {
      bestRevenue = revenue;
      bestRevenueMonth = month;
    }
  }

  const monthlyRevenue = Array.from(revenueByMonth.entries()).map(([month, revenue]) => ({ month, revenue })).sort((a, b) => a.month.localeCompare(b.month));

  // Calculate average order value
  const totalOrderValue = deliveredOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const averageOrderValue = deliveredOrders.length > 0 ? totalOrderValue / deliveredOrders.length : 0;

  ApiResponse.success(res, {
    revenue: {
      today: revenueToday,
      week: revenue7d,
      month: revenue30d,
      year: revenue365d,
      total: revenueTotal,
    },
    chart: monthlyRevenue,
    best_revenue_month: bestRevenueMonth,
    average_order_value: averageOrderValue,
  }, "Revenue analytics fetched successfully");
});

export const getOrdersAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access analytics");
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const { data: allOrdersData } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const allOrders = allOrdersData ?? [];

  let totalOrders = allOrders.length;
  let deliveredOrders = 0;
  let pendingOrders = 0;
  let cancelledOrders = 0;
  let returnedOrders = 0;
  let ordersToday = 0;
  let orders7d = 0;
  let orders30d = 0;
  let orders365d = 0;

  const ordersByMonth = new Map<string, number>();

  for (const order of allOrders) {
    const orderDate = new Date(order.created_at);
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
    ordersByMonth.set(monthKey, (ordersByMonth.get(monthKey) || 0) + 1);

    if (order.status === "delivered") deliveredOrders++;
    else if (order.status === "pending") pendingOrders++;
    else if (order.status === "cancelled") cancelledOrders++;

    if (orderDate >= startOfToday) ordersToday++;
    if (orderDate >= sevenDaysAgo) orders7d++;
    if (orderDate >= thirtyDaysAgo) orders30d++;
    if (orderDate >= oneYearAgo) orders365d++;
  }

  const ordersChart = Array.from(ordersByMonth.entries()).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));

  // Get recent orders (last 10)
  const recentOrders = allOrders.slice(0, 10);
  const recentWithItems = await buildOrdersWithItems(recentOrders as Array<Record<string, unknown>>);

  ApiResponse.success(res, {
    orders: {
      total: totalOrders,
      delivered: deliveredOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      returned: returnedOrders,
      today: ordersToday,
      week: orders7d,
      month: orders30d,
      year: orders365d,
    },
    chart: ordersChart,
    recent_orders: recentWithItems,
  }, "Orders analytics fetched successfully");
});

export const getComprehensiveAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access analytics");
  }

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Get orders for calculations
  const { data: ordersData } = await supabase.from("orders").select("*").gte("created_at", oneYearAgo.toISOString());
  const orders = ordersData ?? [];
  const orderItemsMap = await fetchOrderItems(orders.map((o) => String(o.id)));
  const { data: productsData } = await supabase.from("products").select("*");
  const products = productsData ?? [];

  // Calculate orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    const status = order.status as string;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate average order value
  const totalOrderValue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const averageOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;

  // Revenue by month and year
  const revenueByMonth: Record<string, number> = {};
  const revenueByYear: Record<string, number> = {};
  const dailySales: Record<string, number> = {};
  const monthlySales: Record<string, number> = {};
  const yearlySales: Record<string, number> = {};
  // Per-month product sales tracking!
  const monthlyProductSales = new Map<string, Map<string, { qty: number; revenue: number }>>();

  for (const order of orders) {
    if (order.status === "delivered") {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const yearKey = `${date.getFullYear()}`;
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(order.total);
      revenueByYear[yearKey] = (revenueByYear[yearKey] || 0) + Number(order.total);
      dailySales[dayKey] = (dailySales[dayKey] || 0) + Number(order.total);
      monthlySales[monthKey] = (monthlySales[monthKey] || 0) + Number(order.total);
      yearlySales[yearKey] = (yearlySales[yearKey] || 0) + Number(order.total);
    }

    // Update per-month product sales
    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthProductMap = monthlyProductSales.get(monthKey) || new Map();
    const items = orderItemsMap.get(String(order.id)) ?? [];
    for (const item of items) {
      const productId = String(item.product_id ?? "");
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.price ?? 0);
      const existing = monthProductMap.get(productId) || { qty: 0, revenue: 0 };
      monthProductMap.set(productId, { qty: existing.qty + qty, revenue: existing.revenue + qty * price });
    }
    monthlyProductSales.set(monthKey, monthProductMap);
  }

  const productSalesMap = new Map<string, { qty: number; revenue: number; product: Record<string, unknown> | undefined }>();
  for (const order of orders) {
    const items = orderItemsMap.get(String(order.id)) ?? [];
    for (const item of items) {
      const productId = String(item.product_id ?? "");
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.price ?? 0);
      const existing = productSalesMap.get(productId) || {
        qty: 0,
        revenue: 0,
        product: products.find((p) => String(p.id) === productId) as Record<string, unknown> | undefined,
      };
      productSalesMap.set(productId, {
        qty: existing.qty + qty,
        revenue: existing.revenue + qty * price,
        product: existing.product,
      });
    }
  }

  const sortedProducts = Array.from(productSalesMap.values()).sort((a, b) => b.qty - a.qty);
  const topSellingProducts = sortedProducts.slice(0, 10).map(ps => ({
    ...buildProductResponse(ps.product),
    total_sold: ps.qty,
    total_revenue: ps.revenue,
  }));
  const worstSellingProducts = sortedProducts.slice(-10).reverse().map(ps => ({
    ...buildProductResponse(ps.product),
    total_sold: ps.qty,
    total_revenue: ps.revenue,
  }));

  // Calculate per-month top and worst sellers!
  const monthlyTopSellers: Record<string, Array<{ product: any; qty: number; revenue: number }>> = {};
  const monthlyWorstSellers: Record<string, Array<{ product: any; qty: number; revenue: number }>> = {};

  for (const [monthKey, monthProductMap] of monthlyProductSales.entries()) {
    const monthSortedProducts = Array.from(monthProductMap.entries()).sort(([, a], [, b]) => b.qty - a.qty);
    monthlyTopSellers[monthKey] = monthSortedProducts.slice(0, 5).map(([productId, data]) => ({
      product: buildProductResponse(products.find((p: any) => String(p.id) === productId) as any),
      qty: data.qty,
      revenue: data.revenue,
    }));
    monthlyWorstSellers[monthKey] = monthSortedProducts.slice(-5).reverse().map(([productId, data]) => ({
      product: buildProductResponse(products.find((p: any) => String(p.id) === productId) as any),
      qty: data.qty,
      revenue: data.revenue,
    }));
  }

  // Low stock and out of stock
  const lowStockProducts = products
    .filter((p) => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= 10)
    .map((p) => buildProductResponse(p as Record<string, unknown>));
  const outOfStockProducts = products
    .filter((p) => Number(p.stock ?? 0) === 0)
    .map((p) => buildProductResponse(p as Record<string, unknown>));

  // Newest products
  const newestProducts = [...products]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((p: any) => buildProductResponse(p));

  // Latest orders (already fetched, sorted desc)
  const latestOrders = await buildOrdersWithItems(
    [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10) as Array<Record<string, unknown>>,
  );

  // Recent reviews
  const { data: recentReviewsData } = await supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(10);
  const recentReviews = recentReviewsData ?? [];

  ApiResponse.success(res, {
    ordersByStatus,
    averageOrderValue,
    revenueByMonth,
    revenueByYear,
    dailySales,
    monthlySales,
    yearlySales,
    topSellingProducts,
    worstSellingProducts,
    monthlyTopSellers,
    monthlyWorstSellers,
    allSellingProducts: sortedProducts.map(ps => ({
      ...buildProductResponse(ps.product),
      total_sold: ps.qty,
      total_revenue: ps.revenue,
    })),
    lowStockProducts,
    outOfStockProducts,
    newestProducts,
    latestOrders,
    recentReviews: recentReviews.map(buildReviewResponse),
  }, "Comprehensive analytics fetched successfully");
});

// Admin settings endpoints
export const updateAdminEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can update their email");
  const { email, currentPassword } = req.body as { email?: string; currentPassword?: string };
  if (!email || !currentPassword) throw ApiError.badRequest("Email and current password are required");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw ApiError.badRequest("Please provide a valid email address");

  await AuthService.verifyCurrentPassword(req.user!.id, currentPassword);

  const { error } = await supabase.auth.admin.updateUserById(req.user!.id, {
    email: email.toLowerCase().trim(),
  });
  if (error) throw ApiError.badRequest(error.message);

  ApiResponse.success(res, { email }, "Email updated successfully");
});

export const updateAdminPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can update their password");
  const { currentPassword, newPassword, confirmPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw ApiError.badRequest("All password fields are required");
  }
  if (newPassword !== confirmPassword) throw ApiError.badRequest("New passwords do not match");
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw ApiError.badRequest("Password must be 8+ chars with upper, lower, number, and special char");
  }

  await AuthService.verifyCurrentPassword(req.user!.id, currentPassword);

  const { error } = await supabase.auth.admin.updateUserById(req.user!.id, { password: newPassword });
  if (error) throw ApiError.internal(error.message);

  ApiResponse.success(res, undefined, "Password updated successfully");
});

export const updateUserEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Not authenticated");
  const { email, currentPassword } = req.body as { email?: string; currentPassword?: string };
  if (!email || !currentPassword) throw ApiError.badRequest("Email and current password are required");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw ApiError.badRequest("Please provide a valid email address");

  await AuthService.verifyCurrentPassword(req.user.id, currentPassword);

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
    email: email.toLowerCase().trim(),
  });
  if (error) throw ApiError.badRequest(error.message);

  ApiResponse.success(res, { email }, "Email updated successfully");
});

export const updateUserPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Not authenticated");
  const { currentPassword, newPassword, confirmPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw ApiError.badRequest("All password fields are required");
  }
  if (newPassword !== confirmPassword) throw ApiError.badRequest("New passwords do not match");
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw ApiError.badRequest("Password must be 8+ chars with upper, lower, number, and special char");
  }

  await AuthService.verifyCurrentPassword(req.user.id, currentPassword);

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: newPassword });
  if (error) throw ApiError.internal(error.message);

  ApiResponse.success(res, undefined, "Password updated successfully");
});

// Reviews endpoints
export const getReviewsByProduct = asyncHandler(async (req: Request, res: Response) => {
  const { data: product } = await supabase.from("products").select("id").eq("slug", req.params.slug).single();
  if (!product) throw ApiError.notFound("Product not found");
  const { data: reviews } = await supabase.from("reviews").select("*").eq("product_id", product.id).eq("is_visible", true).order("created_at", { ascending: false });
  ApiResponse.success(res, (reviews ?? []).map(buildReviewResponse), "Reviews fetched successfully");
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { data: product } = await supabase.from("products").select("id").eq("slug", req.params.slug).single();
  if (!product) throw ApiError.notFound("Product not found");

  const { customerName, customerEmail, rating, comment, userId } = req.body as {
    customerName?: string; customerEmail?: string; rating?: number; comment?: string; userId?: string;
  };

  if (!customerName || !customerEmail || !rating || !comment) throw ApiError.badRequest("Name, email, rating, and comment are required");
  if (rating < 1 || rating > 5) throw ApiError.badRequest("Rating must be between 1 and 5");

  const { data: review, error } = await supabase.from("reviews").insert({
    product_id: product.id,
    user_id: userId || null,
    customer_name: customerName.trim(),
    customer_email: customerEmail.trim().toLowerCase(),
    rating,
    comment: comment.trim(),
    is_visible: true,
  }).select().single();

  if (error || !review) throw ApiError.internal("Failed to create review");
  ApiResponse.created(res, buildReviewResponse(review), "Review created successfully");
});

export const getAllReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can access all reviews");

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("reviews").select("*, products(name_fr, name_ar, slug)", { count: "exact" }).order("created_at", { ascending: false });

  if (req.query.productId) query = query.eq("product_id", req.query.productId as string);
  if (req.query.search) {
    const s = req.query.search as string;
    query = query.or(`customer_name.ilike.%${s}%,comment.ilike.%${s}%`);
  }

  query = query.range(from, to);
  const { data: reviews, count, error } = await query;
  if (error) throw ApiError.internal("Failed to fetch reviews");

  const total = count ?? 0;
  ApiResponse.success(res, {
    reviews: (reviews ?? []).map(buildReviewResponse),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  }, "Reviews fetched successfully");
});

export const toggleReviewVisibility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can toggle review visibility");
  const { data: review } = await supabase.from("reviews").select("is_visible").eq("id", req.params.id).single();
  if (!review) throw ApiError.notFound("Review not found");
  const { data: updated } = await supabase.from("reviews").update({ is_visible: !review.is_visible }).eq("id", req.params.id).select().single();
  ApiResponse.success(res, { isVisible: updated?.is_visible }, "Review visibility toggled successfully");
});

export const deleteReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can delete reviews");
  const { error } = await supabase.from("reviews").delete().eq("id", req.params.id);
  if (error) throw ApiError.notFound("Review not found");
  ApiResponse.success(res, null, "Review deleted successfully");
});

function formatContactSettings(settings: Record<string, unknown>) {
  return {
    id: String(settings.id ?? 1),
    whatsappNumber: String(settings.whatsapp_number ?? ""),
    contactName: String(settings.contact_name ?? "Lem3ansra n Jeddi"),
    email: String(settings.email ?? ""),
    phone: String(settings.phone ?? ""),
    address: String(settings.address ?? ""),
    createdAt: String(settings.updated_at ?? new Date().toISOString()),
    updatedAt: String(settings.updated_at ?? new Date().toISOString()),
  };
}

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw ApiError.internal("Failed to fetch categories");
  ApiResponse.success(res, categories ?? [], "Categories fetched successfully");
});

export const getStoreSettings = asyncHandler(async (_req: Request, res: Response) => {
  const { data: settings, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw ApiError.internal("Failed to fetch store settings");
  if (!settings) {
    const { data: created, error: createError } = await supabase
      .from("store_settings")
      .insert({ id: 1 })
      .select()
      .single();
    if (createError || !created) throw ApiError.internal("Failed to initialize store settings");
    return ApiResponse.success(res, created, "Store settings fetched successfully");
  }

  ApiResponse.success(res, settings, "Store settings fetched successfully");
});

// Contact Settings endpoints (backed by store_settings)
export const getContactSettings = asyncHandler(async (_req: Request, res: Response) => {
  const { data: settings, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw ApiError.internal("Failed to fetch contact settings");

  if (!settings) {
    const { data: created, error: createError } = await supabase
      .from("store_settings")
      .insert({
        id: 1,
        contact_name: "Lem3ansra n Jeddi",
        whatsapp_number: "",
        email: "",
        phone: "",
        address: "",
      })
      .select()
      .single();
    if (createError || !created) throw ApiError.internal("Failed to initialize contact settings");
    return ApiResponse.success(res, formatContactSettings(created), "Contact settings fetched successfully");
  }

  ApiResponse.success(res, formatContactSettings(settings), "Contact settings fetched successfully");
});

export const updateContactSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") throw ApiError.forbidden("Only administrators can update contact settings");

  const { whatsappNumber, contactName, email, phone, address } = req.body as {
    whatsappNumber?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const payload: Record<string, string> = {};
  if (whatsappNumber !== undefined) payload.whatsapp_number = whatsappNumber.trim();
  if (contactName !== undefined) payload.contact_name = contactName.trim();
  if (email !== undefined) payload.email = email.trim().toLowerCase();
  if (phone !== undefined) payload.phone = phone.trim();
  if (address !== undefined) payload.address = address.trim();

  const { data: existing } = await supabase.from("store_settings").select("id").eq("id", 1).maybeSingle();
  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("store_settings")
      .update(payload)
      .eq("id", 1)
      .select()
      .single();
    if (error) throw ApiError.internal("Failed to update contact settings");
    result = data;
  } else {
    const { data, error } = await supabase
      .from("store_settings")
      .insert({ id: 1, ...payload })
      .select()
      .single();
    if (error) throw ApiError.internal("Failed to create contact settings");
    result = data;
  }

  ApiResponse.success(res, formatContactSettings(result as Record<string, unknown>), "Contact settings updated successfully");
});

// Gallery endpoints
export const getGallery = asyncHandler(async (_req: Request, res: Response) => {
  const { data: gallery, error } = await supabase
    .from("gallery")
    .select("*")
    .order("order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw ApiError.internal("Failed to fetch gallery");
  }

  // Convert snake_case to camelCase
  const formattedGallery = gallery.map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    imagePublicId: item.image_public_id,
    order: item.order,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  ApiResponse.success(res, formattedGallery, "Gallery fetched successfully");
});

export const createGalleryItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can create gallery items");
  }

  const { title, description, imageUrl, imagePublicId, order } = req.body as {
    title?: string;
    description?: string;
    imageUrl?: string;
    imagePublicId?: string;
    order?: number;
  };

  if (!imageUrl || !imagePublicId) {
    throw ApiError.badRequest("Image URL and public ID are required");
  }

  let nextOrder = order;
  if (nextOrder === undefined) {
    const { data: maxOrderData } = await supabase
      .from("gallery")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .single();
    
    nextOrder = (maxOrderData?.order ?? 0) + 1;
  }

  const { data: item, error } = await supabase
    .from("gallery")
    .insert({
      title: title || "",
      description: description || "",
      image_url: imageUrl,
      image_public_id: imagePublicId,
      order: nextOrder,
    })
    .select()
    .single();

  if (error || !item) {
    throw ApiError.internal("Failed to create gallery item");
  }

  const formattedItem = {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    imagePublicId: item.image_public_id,
    order: item.order,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };

  ApiResponse.success(res, formattedItem, "Gallery item created successfully");
});

export const updateGalleryItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can update gallery items");
  }

  const { id } = req.params;
  const { title, description, imageUrl, imagePublicId, order } = req.body as {
    title?: string;
    description?: string;
    imageUrl?: string;
    imagePublicId?: string;
    order?: number;
  };

  const payload: any = {};
  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (imageUrl !== undefined) payload.image_url = imageUrl;
  if (imagePublicId !== undefined) payload.image_public_id = imagePublicId;
  if (order !== undefined) payload.order = order;

  const { data: item, error } = await supabase
    .from("gallery")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error || !item) {
    throw ApiError.notFound("Gallery item not found");
  }

  const formattedItem = {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    imagePublicId: item.image_public_id,
    order: item.order,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };

  ApiResponse.success(res, formattedItem, "Gallery item updated successfully");
});

export const deleteGalleryItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can delete gallery items");
  }

  const { data: item, error: fetchError } = await supabase
    .from("gallery")
    .select("image_public_id")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !item) {
    throw ApiError.notFound("Gallery item not found");
  }

  try {
    await cloudinary.uploader.destroy(item.image_public_id);
  } catch {
    // Ignore cleanup errors
  }

  const { error: deleteError } = await supabase
    .from("gallery")
    .delete()
    .eq("id", req.params.id);

  if (deleteError) {
    throw ApiError.internal("Failed to delete gallery item");
  }

  ApiResponse.success(res, null, "Gallery item deleted successfully");
});

export const reorderGallery = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Only administrators can reorder gallery");
  }

  const { items } = req.body as { items: Array<{ id: string; order: number }> };

  if (!Array.isArray(items)) {
    throw ApiError.badRequest("Items must be an array");
  }

  // Update sequentially for simplicity
  for (const { id, order } of items) {
    await supabase.from("gallery").update({ order }).eq("id", id);
  }

  ApiResponse.success(res, null, "Gallery reordered successfully");
});
