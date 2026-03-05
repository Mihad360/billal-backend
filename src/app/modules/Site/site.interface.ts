import { Types } from "mongoose";

// Site Interface
export interface ISite {
  _id?: Types.ObjectId;
  createdBy: Types.ObjectId;
  companyId: Types.ObjectId;
  siteOwner: string;
  siteTitle: string;
  buildingType:
    | "Residential"
    | "Commercial"
    | "Industrial"
    | "Mixed-Use"
    | "Infrastructure"
    | "Other";
  location: {
    address?: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };
  status: "To-Do" | "In-Progress" | "Done";
  officeAdminRemarks?: string;
  completionDescription?: string;
  photos?: string[];
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isDeleted: boolean;
}

// Separate input type for what frontend sends
export interface ISiteInput extends Omit<ISite, "location"> {
  location: {
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}
