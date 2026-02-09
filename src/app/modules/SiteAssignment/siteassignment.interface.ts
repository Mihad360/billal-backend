import { Types } from "mongoose";
import { ISite } from "../Site/site.interface";
import { IUser } from "../User/user.interface";
import { ISiteFile } from "../SiteFile/sitefile.interface";

// Site Assignment Interface
export interface ISiteAssignment {
  _id?: Types.ObjectId;
  siteId: Types.ObjectId;
  fileId: Types.ObjectId;
  workerId: Types.ObjectId;
  assignedBy: Types.ObjectId;
  assignedAt: Date;
  isActive: boolean;
}

export interface ISiteAssignmentPopulated {
  _id?: Types.ObjectId;

  siteId: ISite; // populated Site
  fileId: ISiteFile;
  workerId: IUser; // populated Worker
  assignedBy: IUser; // populated Admin

  assignedAt: Date;
  isActive: boolean;
}
