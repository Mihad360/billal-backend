import { Schema, model } from "mongoose";
import { ISite } from "./site.interface";

const SiteSchema = new Schema<ISite>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    siteOwner: {
      type: String,
      required: true,
    },
    siteTitle: {
      type: String,
      required: true,
    },
    buildingType: {
      type: String,
      enum: [
        "Residential",
        "Commercial",
        "Industrial",
        "Mixed-Use",
        "Infrastructure",
        "Other",
      ],
      required: true,
    },
    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },
    },
    status: {
      type: String,
      enum: ["To-Do", "In-Progress", "Done"],
      default: "To-Do",
      required: true,
    },
    officeAdminRemarks: {
      type: String,
      trim: true,
    },
    completionDescription: {
      type: String,
      trim: true,
      default: "",
    },
    photos: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Index for geospatial queries (optional but recommended)
SiteSchema.index({ "location.coordinates": "2dsphere" });

// Index for common queries
SiteSchema.index({ status: 1, createdAt: -1 });
SiteSchema.index({ createdBy: 1 });

export const SiteModel = model<ISite>("Site", SiteSchema);
