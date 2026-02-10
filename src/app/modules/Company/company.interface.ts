import { Types } from "mongoose";

export interface ICompany {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  address: string;
  workType: string; // ✅ now string (e.g. "IT", "Education", "E-commerce")
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
