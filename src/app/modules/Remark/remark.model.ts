import { Schema, model } from "mongoose";
import { ISiteTaskRemark } from "./remark.interface";

const remarkHistorySchema = new Schema(
  {
    remarkedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["office_admin", "worker"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    remarkedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    statusAtTime: {
      type: String,
    },
  },
  { _id: false },
);

const siteTaskRemarkSchema = new Schema<ISiteTaskRemark>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "SiteTask",
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: "Site",
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "SiteFile",
    },
    lastRemarkedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastRemarkedRole: {
      type: String,
      enum: ["office_admin", "worker"],
    },
    lastRemarkedAt: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    history: {
      type: [remarkHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt automatically
  },
);

export const SiteTaskRemarkModel = model<ISiteTaskRemark>(
  "SiteTaskRemark",
  siteTaskRemarkSchema,
);
