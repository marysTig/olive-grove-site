import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name_fr: string;
  name_ar: string;
  slug: string;
  description_fr?: string;
  description_ar?: string;
  price: number;
  discount_pct: number;
  stock: number;
  category_id?: string | null;
  images: string[];
  image_public_ids: string[];
  badge?: string | null;
  volume_ml?: number | null;
  origin?: string | null;
  harvest_date?: string | null;
  rating: number;
  featured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name_fr: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    name_ar: {
      type: String,
      trim: true,
      default: '',
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description_fr: {
      type: String,
      default: '',
    },
    description_ar: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    discount_pct: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 0,
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
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
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
  }
);

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
export default Product;
