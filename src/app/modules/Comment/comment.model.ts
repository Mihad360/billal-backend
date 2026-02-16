import { Schema, model } from "mongoose";
import { ISiteTaskComment } from "./comment.interface";

const siteTaskCommentSchema = new Schema<ISiteTaskComment>(
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
    commentedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userRole: {
      type: String,
      enum: ["office_admin", "worker"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  },
);

export const SiteTaskCommentModel = model<ISiteTaskComment>(
  "SiteTaskComment",
  siteTaskCommentSchema,
);
