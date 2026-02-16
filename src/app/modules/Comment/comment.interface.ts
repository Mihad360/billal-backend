import { Types } from "mongoose";

// NEW MODEL: SiteTaskComment.interface.ts
export interface ISiteTaskComment {
  _id?: Types.ObjectId;
  taskId: Types.ObjectId;
  siteId: Types.ObjectId;
  fileId: Types.ObjectId;
  // Who commented
  commentedBy: Types.ObjectId;
  userRole: "office_admin" | "worker";
  // Comment content
  message: string;
  images?: string[]; // Optional attachments
  // Not like remark - just simple comments, no status change
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
