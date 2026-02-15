import { Types } from "mongoose";

export interface ISiteTask {
  _id?: Types.ObjectId;
  siteId: Types.ObjectId;
  fileId: Types.ObjectId; // Which file this pin is on

  // Pin location on the file
  pinLocation: {
    x: number; // X coordinate (percentage or pixel)
    y: number; // Y coordinate (percentage or pixel)
    pageNumber?: number; // For multi-page PDFs
  };

  // Task details
  title: string;
  description?: string;
  images?: string[];
  // Assignment
  assignedTo?: Types.ObjectId; // Worker assigned to this task
  assignedBy: Types.ObjectId; // Admin who created/assigned the task
  assignedAt: Date;

  // Status tracking
  status: "To-Do" | "In-Progress" | "Done" | "Remark";

  // Dates
  dueDate?: Date;
  completedAt?: Date;

  // Attachments (worker can add photos for this specific task)
  attachments?: string[]; // URLs to images/files

  createdAt: Date;
  updatedAt: Date;
}
