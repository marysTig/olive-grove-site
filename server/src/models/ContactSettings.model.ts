import mongoose, { Document, Schema, Model } from "mongoose";

export interface IContactSettings extends Document {
  _id: mongoose.Types.ObjectId;
  whatsappNumber: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSettingsSchema = new Schema<IContactSettings>(
  {
    whatsappNumber: {
      type: String,
      required: [true, "WhatsApp number is required"],
      trim: true,
      default: "",
    },
    contactName: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
      default: "Lem3ansra n Jeddi",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      default: "",
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

// Ensure only one document exists
contactSettingsSchema.pre("save", async function (next) {
  const count = await mongoose.models.ContactSettings.countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error("Only one contact settings document is allowed");
  }
  next();
});

const ContactSettings: Model<IContactSettings> = mongoose.model<IContactSettings>("ContactSettings", contactSettingsSchema);
export default ContactSettings;
