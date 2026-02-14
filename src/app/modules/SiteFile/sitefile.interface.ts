import { Types } from "mongoose";

// Site File Interface (Task Files - PDF/Images uploaded by admin)
export interface ISiteFile {
  _id?: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  siteId: Types.ObjectId;
  fileName: string;
  fileType: "pdf" | "image" | "document" | "other";
  fileUrl: string;
  fileSize?: string;
  uploadedAt: Date;
}
