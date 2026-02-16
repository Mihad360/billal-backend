import { Schema, model } from "mongoose";
import { ISite } from "./site.interface";

const SiteSchema = new Schema<ISite>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
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
    endDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Index for geospatial queries (optional but recommended)
SiteSchema.index({ "location.coordinates": "2dsphere" });

export const SiteModel = model<ISite>("Site", SiteSchema);
