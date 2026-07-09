import { Request, Response } from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import Product from "@/models/Product.model";
import { normalizeProductPayload } from "@/utils/productUtils";
import { env } from "@/config/env.config";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

export const uploadProductImage = [
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest("No image file provided");
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_FOLDER || "olive-grove-emporium/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Image upload failed",
          });
        }

        ApiResponse.success(
          res,
          {
            url: result.secure_url,
            public_id: result.public_id,
          },
          "Image uploaded successfully",
        );
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  }),
];

export const getProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  ApiResponse.success(res, products, "Products fetched successfully");
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  ApiResponse.success(res, product, "Product fetched successfully");
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const payload = normalizeProductPayload(req.body);
  const existing = await Product.findOne({ slug: payload.slug });
  if (existing) {
    payload.slug = `${payload.slug}-${Date.now()}`;
  }

  const product = await Product.create(payload);
  ApiResponse.created(res, product, "Product created successfully");
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const payload = normalizeProductPayload(req.body);
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  if (payload.slug && payload.slug !== product.slug) {
    const existing = await Product.findOne({ slug: payload.slug, _id: { $ne: product._id } });
    if (existing) {
      payload.slug = `${payload.slug}-${Date.now()}`;
    }
  }

  Object.assign(product, payload);
  await product.save();

  ApiResponse.success(res, product, "Product updated successfully");
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  for (const publicId of product.image_public_ids ?? []) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // Ignore cleanup failures for deleted assets
    }
  }

  await product.deleteOne();
  ApiResponse.success(res, null, "Product deleted successfully");
});
