/**
 * Products Seed Script
 *
 * Creates 10 realistic olive oil products.
 * Run with: npx ts-node -r tsconfig-paths/register src/database/seed-products.ts
 */
import { env } from "@server/config/env.config";
import { connectDatabase, disconnectDatabase } from "@server/database/connection";
import Product from "@server/models/Product.model";
import { logger } from "@server/utils/logger";

async function seedProducts(): Promise<void> {
  try {
    await connectDatabase();

    // Delete existing products first
    const deletedCount = await Product.deleteMany({});
    logger.info(`🗑️  Deleted ${deletedCount.deletedCount} existing products`);

    // Define 10 olive oil products
    const products = [
      {
        name_fr: "Huile d'olive extra vierge 500ml",
        name_ar: "زيت زيتون بكر ممتاز 500مل",
        slug: "huile-d-olive-extra-vierge-500ml",
        description_fr: "Huile d'olive extra vierge de haute qualité, pressée à froid. Parfaite pour toutes vos préparations culinaires.",
        description_ar: "زيت زيتون بكر ممتاز عالي الجودة، معصور على البارد. مثالي لجميع تحضيراتك المطبخية.",
        price: 1500,
        discount_pct: 0,
        quantity: 120,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd5537?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/extra-vierge-500ml"],
        badge: "Nouveau",
        volume_ml: 500,
        origin: "Algérie",
        harvest_date: new Date("2024-10-15"),
        featured: true,
        active: true,
      },
      {
        name_fr: "Huile d'olive extra vierge 1L",
        name_ar: "زيت زيتون بكر ممتاز 1 لتر",
        slug: "huile-d-olive-extra-vierge-1l",
        description_fr: "Huile d'olive extra vierge 1L, issue des meilleures olives de la région. Arôme intense et goût riche.",
        description_ar: "زيت زيتون بكر ممتاز 1 لتر، مصدره أجود الزيتون في المنطقة. رائحة مكثفة وطعم غني.",
        price: 2800,
        discount_pct: 10,
        quantity: 85,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1536000238517-f15d69fbbf0f?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/extra-vierge-1l"],
        badge: "Promo",
        volume_ml: 1000,
        origin: "Tunisie",
        harvest_date: new Date("2024-09-20"),
        featured: true,
        active: true,
      },
      {
        name_fr: "Huile d'olive premium 2L",
        name_ar: "زيت زيتون ممتاز 2 لتر",
        slug: "huile-d-olive-premium-2l",
        description_fr: "Notre huile d'olive premium 2L, sélectionnée pour son excellence. Parfaite pour les connaisseurs.",
        description_ar: "زيت الزيتون المتميز لدينا 2 لتر، مختار لأجل تميزه. مثالي للمختصين.",
        price: 5200,
        discount_pct: 0,
        quantity: 45,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1556542378-383e398e5177?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/premium-2l"],
        badge: "Premium",
        volume_ml: 2000,
        origin: "Maroc",
        harvest_date: new Date("2024-11-05"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Huile d'olive traditionnelle 5L",
        name_ar: "زيت زيتون تقليدي 5 لتر",
        slug: "huile-d-olive-traditionnelle-5l",
        description_fr: "Huile d'olive traditionnelle 5L, issue de méthodes de fabrication ancestrales. Parfaite pour un usage quotidien.",
        description_ar: "زيت زيتون تقليدي 5 لتر، مصدره طرق تصنيع قديمة. مثالي للاستخدام اليومي.",
        price: 11500,
        discount_pct: 5,
        quantity: 30,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/traditionnelle-5l"],
        badge: "Famille",
        volume_ml: 5000,
        origin: "Algérie",
        harvest_date: new Date("2024-08-30"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Huile d'olive bio",
        name_ar: "زيت زيتون عضوي",
        slug: "huile-d-olive-bio",
        description_fr: "Huile d'olive 100% biologique, issue de l'agriculture écologique. Saine et délicieuse.",
        description_ar: "زيت زيتون عضوي 100٪، مصدره الزراعة البيئية. صحي ولذيذ.",
        price: 3500,
        discount_pct: 0,
        quantity: 60,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/bio"],
        badge: "Bio",
        volume_ml: 750,
        origin: "Espagne",
        harvest_date: new Date("2024-10-01"),
        featured: true,
        active: true,
      },
      {
        name_fr: "Huile d'olive pressée à froid",
        name_ar: "زيت زيتون معصور على البارد",
        slug: "huile-d-olive-presse-a-froid",
        description_fr: "Huile d'olive pressée à froid, préservant tous les nutriments et saveurs.",
        description_ar: "زيت زيتون معصور على البارد، يحفظ جميع المغذيات والنكهات.",
        price: 4200,
        discount_pct: 0,
        quantity: 75,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/cold-pressed"],
        badge: "Cold Pressed",
        volume_ml: 1000,
        origin: "Italie",
        harvest_date: new Date("2024-09-10"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Pack familial",
        name_ar: "عبوة عائلية",
        slug: "pack-familial",
        description_fr: "Notre pack familial : 2x1L extra vierge + 1x500ml aromatisée. Offre exceptionnelle !",
        description_ar: "عبوتنا العائلية: 2×1 لتر بكر ممتاز + 1×500 مل بنكهة. عرض استثنائي!",
        price: 6500,
        discount_pct: 15,
        quantity: 40,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/pack-familial"],
        badge: "Offre",
        volume_ml: 2500,
        origin: "Mixte",
        harvest_date: new Date("2024-10-25"),
        featured: true,
        active: true,
      },
      {
        name_fr: "Huile d'olive gastronomique",
        name_ar: "زيت زيتون مطبخي فاخر",
        slug: "huile-d-olive-gastronomique",
        description_fr: "Huile d'olive gastronomique pour les chefs et amateurs de cuisine fine.",
        description_ar: "زيت زيتون مطبخي فاخر للطهاة والمحبين للطبخ الراقي.",
        price: 6800,
        discount_pct: 0,
        quantity: 25,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/gastronomique"],
        badge: "Gourmet",
        volume_ml: 750,
        origin: "Grèce",
        harvest_date: new Date("2024-08-15"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Huile d'olive verte",
        name_ar: "زيت زيتون أخضر",
        slug: "huile-d-olive-verte",
        description_fr: "Huile d'olive verte, aux arômes frais et herbacés. Récoltée précocement.",
        description_ar: "زيت زيتون أخضر، بروائح طازجة وعشبية. حصاد مبكر.",
        price: 3200,
        discount_pct: 0,
        quantity: 55,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/verte"],
        badge: "Verte",
        volume_ml: 500,
        origin: "Portugal",
        harvest_date: new Date("2024-07-20"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Édition récolte premium",
        name_ar: "طبعة حصاد متميزة",
        slug: "edition-recolte-premium",
        description_fr: "Notre édition limitée récolte premium, issue des meilleures olives de l'année 2024.",
        description_ar: "طبعتنا المحدودة لحصاد متميز، مصدرها أجود الزيتون لعام 2024.",
        price: 8500,
        discount_pct: 0,
        quantity: 15,
        category_id: null,
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/edition-premium"],
        badge: "Limited",
        volume_ml: 1000,
        origin: "Algérie",
        harvest_date: new Date("2024-11-15"),
        featured: true,
        active: true,
      },
    ];

    // Insert all products
    const createdProducts = await Product.insertMany(products);
    logger.info(`🎉 Successfully seeded ${createdProducts.length} products!`);
    for (const product of createdProducts) {
      logger.info(`   • ${product.name_fr} (${product.slug}) — ${product.price} DA`);
    }

    await disconnectDatabase();
    logger.info("✅ Seed complete!");
  } catch (error) {
    logger.error("Failed to seed products:", error);
    process.exit(1);
  }
}

seedProducts();
