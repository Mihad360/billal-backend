import { Types } from "mongoose";

export interface ISiteTaskRemark {
  _id?: Types.ObjectId;
  taskId: Types.ObjectId; // One remark per task
  siteId: Types.ObjectId;
  fileId: Types.ObjectId;

  // Last person who remarked
  lastRemarkedBy: Types.ObjectId;
  lastRemarkedRole: "office_admin" | "worker";
  lastRemarkedAt: Date;

  // Current remark content (gets replaced each time)
  description: string;
  images?: string[]; // Latest images

  // Remark history (so you can see conversation)
  history?: Array<{
    remarkedBy: Types.ObjectId;
    userRole: "office_admin" | "worker";
    description: string;
    images?: string[];
    remarkedAt: Date;
    statusAtTime?: string; // What status was when this remark was added
  }>;

  createdAt: Date;
  updatedAt: Date;
}
