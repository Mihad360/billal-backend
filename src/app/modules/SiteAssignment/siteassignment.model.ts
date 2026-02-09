import { Schema, model } from "mongoose";
import { ISiteAssignment } from "./siteassignment.interface";

const siteAssignmentSchema = new Schema<ISiteAssignment>(
  {
    siteId: {
      type: Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "SiteFile",
      required: true,
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const SiteAssignmentModel = model<ISiteAssignment>(
  "SiteAssignment",
  siteAssignmentSchema,
);
