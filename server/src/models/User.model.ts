import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ── Role enum ──────────────────────────────────────────────────
export const ROLES = ['admin', 'client'] as const;
export type Role = (typeof ROLES)[number];

// ── User document interface ────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;

  /** Compare a plain-text candidate against the stored hash */
  comparePassword(candidate: string): Promise<boolean>;
}

// ── Schema ─────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be either admin or client',
      },
      default: 'client',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // auto createdAt + updatedAt
    toJSON: {
      // Strip sensitive fields when serializing to JSON
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);


// ── Pre-save: hash password if modified ────────────────────────
userSchema.pre<IUser>('save', async function (next) {
  // Only hash if the passwordHash field is new or modified
  if (!this.isModified('passwordHash')) return next();

  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ── Instance method: compare password ──────────────────────────
userSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

// ── Export model ───────────────────────────────────────────────
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
