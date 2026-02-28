import { Schema, model } from "mongoose";
import { ISiteTask } from "./task.interface";

const SiteTaskSchema = new Schema<ISiteTask>(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["To-Do", "In-Progress", "Done", "Remark"],
      default: "To-Do",
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    attachments: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const SiteTaskModel = model<ISiteTask>("SiteTask", SiteTaskSchema);
