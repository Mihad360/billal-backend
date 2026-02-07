// Site Interface
export interface ISite {
  _id: string;
  siteName: string;
  siteTitle: string;
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
  completionPhotos?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
