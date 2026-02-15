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
    pinLocation: {
      x: {
        type: Number,
        required: true,
        min: 0,
        max: 100, // Percentage
      },
      y: {
        type: Number,
        required: true,
        min: 0,
        max: 100, // Percentage
      },
      pageNumber: {
        type: Number,
        min: 1,
      },
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
  },
  {
    timestamps: true,
  },
);

export const SiteTaskModel = model<ISiteTask>("SiteTask", SiteTaskSchema);
