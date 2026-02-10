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
    address: string;
    coordinates: {
      lat: number;
      lng: number;
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
}
