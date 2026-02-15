import { Schema, model } from "mongoose";
import { ISiteTaskRemark } from "./remark.interface";

const SiteTaskRemarkSchema = new Schema<ISiteTaskRemark>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "SiteTask",
      required: true,
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "SiteFile",
    },
    createdBy: {
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
    status: {
      type: String,
      enum: ["To-Do", "In-Progress", "Done", "Remark"],
    },
  },
  {
    timestamps: true,
  },
);

export const SiteTaskRemark = model<ISiteTaskRemark>(
  "Remark",
  SiteTaskRemarkSchema,
);
