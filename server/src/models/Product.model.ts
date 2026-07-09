import mongoose, { Document, Schema, Model } from "mongoose";

export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name_fr: string;
  name_ar: string;
  slug: string;
  description_fr?: string;
  description_ar?: string;
  price: number;
  discount_pct: number;
  quantity: number;
  status: ProductStatus;
  category_id?: string | null;
  images: string[];
  image_public_ids: string[];
  badge?: string | null;
  volume_ml?: number | null;
  origin?: string | null;
  harvest_date?: Date | null;
  featured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function computeStatus(quantity: number): ProductStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= 10) return "low_stock";
  return "in_stock";
}

const productSchema = new Schema<IProduct>(
  {
    name_fr: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },
    name_ar: {
      type: String,
      trim: true,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description_fr: {
      type: String,
      default: "",
    },
    description_ar: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    discount_pct: {
      type: Number,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
      default: 0,
    },
    quantity: {
      type: Number,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "out_of_stock",
    },
    category_id: {
      type: String,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    image_public_ids: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      default: null,
    },
    volume_ml: {
      type: Number,
      default: null,
    },
    origin: {
      type: String,
      default: null,
    },
    harvest_date: {
      type: Date,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

productSchema.pre("save", function (next) {
  this.status = computeStatus(this.quantity);
  next();
});

productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as { quantity?: number };
  if (update.quantity !== undefined) {
    this.set("status", computeStatus(update.quantity));
  }
  next();
});

const Product: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);
export default Product;
