import { Schema, model, Types } from "mongoose";

const SiteFileSchema = new Schema(
  {
    uploadedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    siteId: {
      type: Types.ObjectId,
      ref: "Site",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image", "document", "other"],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
  },
  {
    timestamps: true,
  },
);

export const SiteFileModel = model("SiteFile", SiteFileSchema);
