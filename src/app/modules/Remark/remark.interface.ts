import { Types } from "mongoose";

export interface ISiteTaskRemark {
  _id?: Types.ObjectId;
  taskId: Types.ObjectId; // Which task this remark is for
  siteId: Types.ObjectId; // For easier querying
  fileId: Types.ObjectId;

  // Who made the remark
  createdBy: Types.ObjectId;
  userRole: "office_admin" | "worker"; // To quickly identify who remarked

  // Remark content
  description: string;
  images?: string[]; // Worker/Admin can attach images

  // If this remark changes task status
  status?: "To-Do" | "In-Progress" | "Done" | "Remark";

  createdAt: Date;
  updatedAt: Date;
}
