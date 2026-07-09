import User from "@/models/User.model";
import Product from "@/models/Product.model";
import ContactSettings from "@/models/ContactSettings.model";
import Gallery from "@/models/Gallery.model";
import { logger } from "@/utils/logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@lem3ansra.dz";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrateur";

/**
 * Automatically initializes the database with a default admin user if none exists.
 * Does not manage database connection or process exits, making it safe to run in-app.
 */
export async function autoSeedAdmin(): Promise<void> {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      return;
    }

    const admin = await User.create({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD, // Hashed automatically by mongoose pre-save hook
      role: "admin",
      isActive: true,
    });

    logger.info("First-time automatic admin initialization successful!");
    logger.info(`Name:     ${admin.fullName}`);
    logger.info(`Email:    ${admin.email}`);
    logger.info(`Role:     ${admin.role}`);
  } catch (error) {
    logger.error("Failed to run automatic admin initialization:", error);
  }
}

/**
 * Automatically initializes the database with 10 realistic products if none exist.
 */
export async function autoSeedProducts(): Promise<void> {
  try {
    const existingProducts = await Product.countDocuments();

    if (existingProducts > 0) {
      return;
    }

    // Define 10 olive oil products
    const products = [
      {
        name_fr: "Huile d'olive extra vierge 500ml",
        name_ar: "زيت زيتون بكر ممتاز 500مل",
        slug: "huile-d-olive-extra-vierge-500ml",
        description_fr: "Huile d'olive extra vierge de haute qualite, pressee a froid. Parfaite pour toutes vos preparations culinaires.",
        description_ar: "زيت زيتون بكر ممتاز عالي الجودة، معصور على البارد. مثالي لجميع تحضيراتك المطبخية.",
        price: 1500,
        discount_pct: 0,
        quantity: 120,
        images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd5537?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/extra-vierge-500ml"],
        volume_ml: 500,
        origin: "Algerie",
        harvest_date: new Date("2024-10-15"),
        featured: true,
        active: true,
      },
      {
        name_fr: "Huile d'olive extra vierge 1L",
        name_ar: "زيت زيتون بكر ممتاز 1 لتر",
        slug: "huile-d-olive-extra-vierge-1l",
        description_fr: "Huile d'olive extra vierge 1L, issue des meilleures olives de la region. Arome intense et gout riche.",
        description_ar: "زيت زيتون بكر ممتاز 1 لتر، مصدره أجود الزيتون في المنطقة. رائحة مكثفة وطعم غني.",
        price: 2800,
        discount_pct: 10,
        quantity: 85,
        images: ["https://images.unsplash.com/photo-1536000238517-f15d69fbbf0f?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/extra-vierge-1l"],
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
        description_fr: "Notre huile d'olive premium 2L, selectionnee pour son excellence. Parfaite pour les connaisseurs.",
        description_ar: "زيت الزيتون المتميز لدينا 2 لتر، مختار لأجل تميزه. مثالي للمختصين.",
        price: 5200,
        discount_pct: 0,
        quantity: 45,
        images: ["https://images.unsplash.com/photo-1556542378-383e398e5177?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/premium-2l"],
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
        description_fr: "Huile d'olive traditionnelle 5L, issue de methodes de fabrication ancestrales. Parfaite pour un usage quotidien.",
        description_ar: "زيت زيتون تقليدي 5 لتر، مصدره طرق تصنيع قديمة. مثالي للاستخدام اليومي.",
        price: 11500,
        discount_pct: 5,
        quantity: 30,
        images: ["https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/traditionnelle-5l"],
        volume_ml: 5000,
        origin: "Algerie",
        harvest_date: new Date("2024-08-30"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Huile d'olive bio",
        name_ar: "زيت زيتون عضوي",
        slug: "huile-d-olive-bio",
        description_fr: "Huile d'olive 100% biologique, issue de l'agriculture ecologique. Saine et delicieuse.",
        description_ar: "زيت زيتون عضوي 100%، مصدره الزراعة البيئية. صحي ولذيذ.",
        price: 3500,
        discount_pct: 0,
        quantity: 60,
        images: ["https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/bio"],
        volume_ml: 750,
        origin: "Espagne",
        harvest_date: new Date("2024-10-01"),
        featured: true,
        active: true,
      },
      {
        name_fr: "Huile d'olive pressee a froid",
        name_ar: "زيت زيتون معصور على البارد",
        slug: "huile-d-olive-presse-a-froid",
        description_fr: "Huile d'olive pressee a froid, preservant tous les nutriments et saveurs.",
        description_ar: "زيت زيتون معصور على البارد، يحفظ جميع المغذيات والنكهات.",
        price: 4200,
        discount_pct: 0,
        quantity: 75,
        images: ["https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/cold-pressed"],
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
        description_fr: "Notre pack familial : 2x1L extra vierge + 1x500ml aromatisee. Offre exceptionnelle !",
        description_ar: "عبوتنا العائلية: 2×1 لتر بكر ممتاز + 1×500 مل بنكهة. عرض استثنائي!",
        price: 6500,
        discount_pct: 15,
        quantity: 40,
        images: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/pack-familial"],
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
        images: ["https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/gastronomique"],
        volume_ml: 750,
        origin: "Grece",
        harvest_date: new Date("2024-08-15"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Huile d'olive verte",
        name_ar: "زيت زيتون أخضر",
        slug: "huile-d-olive-verte",
        description_fr: "Huile d'olive verte, aux aromes frais et herbaces. Recoltee precocement.",
        description_ar: "زيت زيتون أخضر، بروائح طازجة وعشبية. حصاد مبكر.",
        price: 3200,
        discount_pct: 0,
        quantity: 55,
        images: ["https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/verte"],
        volume_ml: 500,
        origin: "Portugal",
        harvest_date: new Date("2024-07-20"),
        featured: false,
        active: true,
      },
      {
        name_fr: "Edition recolte premium",
        name_ar: "طبعة حصاد متميزة",
        slug: "edition-recolte-premium",
        description_fr: "Notre edition limitee recolte premium, issue des meilleures olives de l'annee 2024.",
        description_ar: "طبعتنا المحدودة لحصاد متميز، مصدرها أجود الزيتون لعام 2024.",
        price: 8500,
        discount_pct: 0,
        quantity: 15,
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"],
        image_public_ids: ["olive-grove-emporium/products/edition-premium"],
        volume_ml: 1000,
        origin: "Algerie",
        harvest_date: new Date("2024-11-15"),
        featured: true,
        active: true,
      },
    ];

    const createdProducts = await Product.insertMany(products);
    logger.info("First-time automatic product initialization successful!");
    logger.info(`Created ${createdProducts.length} products!`);
    for (const product of createdProducts) {
      logger.info(`- ${product.name_fr} (${product.slug}) — ${product.price} DA`);
    }
  } catch (error) {
    logger.error("Failed to run automatic product initialization:", error);
  }
}

/**
 * Automatically initializes contact settings if none exist.
 */
export async function autoSeedContactSettings(): Promise<void> {
  try {
    const existingSettings = await ContactSettings.findOne();

    if (existingSettings) {
      return;
    }

    const settings = await ContactSettings.create({
      whatsappNumber: "+213555123456",
      contactName: "Lem3ansra n Jeddi",
      email: "contact@lem3ansra.dz",
      phone: "+213555123456",
      address: "123 Rue de l'Olivier, Alger, Algérie",
    });

    logger.info("First-time automatic contact settings initialization successful!");
    logger.info(`Contact Name: ${settings.contactName}`);
    logger.info(`Email: ${settings.email}`);
  } catch (error) {
    logger.error("Failed to run automatic contact settings initialization:", error);
  }
}

/**
 * Automatically initializes gallery with sample images if none exist.
 */
export async function autoSeedGallery(): Promise<void> {
  try {
    const existingGallery = await Gallery.countDocuments();

    if (existingGallery > 0) {
      return;
    }

    const galleryItems = [
      {
        title: "Récolte des olives",
        description: "La récolte traditionnelle de nos olives dans les vergers.",
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd5537?w=800&h=600&fit=crop",
        imagePublicId: "olive-grove-emporium/gallery/harvest",
        order: 1,
      },
      {
        title: "Pressage à froid",
        description: "Le pressage à froid pour préserver toutes les qualités de l'huile.",
        imageUrl: "https://images.unsplash.com/photo-1536000238517-f15d69fbbf0f?w=800&h=600&fit=crop",
        imagePublicId: "olive-grove-emporium/gallery/pressing",
        order: 2,
      },
      {
        title: "Bouteilles premium",
        description: "Nos bouteilles d'huile d'olive premium prêtes à l'expédition.",
        imageUrl: "https://images.unsplash.com/photo-1556542378-383e398e5177?w=800&h=600&fit=crop",
        imagePublicId: "olive-grove-emporium/gallery/bottles",
        order: 3,
      },
      {
        title: "Vergers familiaux",
        description: "Nos vergers familiaux transmis de génération en génération.",
        imageUrl: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&h=600&fit=crop",
        imagePublicId: "olive-grove-emporium/orchards",
        order: 4,
      },
    ];

    const createdGallery = await Gallery.insertMany(galleryItems);
    logger.info("First-time automatic gallery initialization successful!");
    logger.info(`Created ${createdGallery.length} gallery items!`);
  } catch (error) {
    logger.error("Failed to run automatic gallery initialization:", error);
  }
}
