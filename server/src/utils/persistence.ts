import { randomUUID } from "node:crypto";
import User from "@server/models/User.model";
import Product from "@server/models/Product.model";

export async function ensureSeedData() {
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount === 0) {
    await User.create({
      fullName: "Administrateur",
      email: "admin@olivegrove.test",
      passwordHash: "Admin@123456",
      role: "admin",
      isActive: true,
    });
  }

  const productCount = await Product.countDocuments({ slug: "huile-dolive-premium" });
  if (productCount === 0) {
    await Product.create({
      id: randomUUID(),
      name_fr: "Huile d’olive premium",
      name_ar: "زيت زيتون فاخر",
      slug: "huile-dolive-premium",
      description_fr: "Huile d’olive extra vierge artisanale.",
      description_ar: "زيت زيتون بكر يدوي فاخر.",
      price: 3200,
      discount_pct: 10,
      stock: 24,
      category_id: null,
      images: [
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      ],
      image_public_ids: ["demo-product-1"],
      badge: "Nouveau",
      volume_ml: 500,
      origin: "Sétif",
      harvest_date: "2025-10",
      featured: true,
      active: true,
    });
  }
}
