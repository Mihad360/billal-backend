import { Model, Types } from "mongoose";
import { IUserSubscription } from "../Subscription/subscription.interface";

export interface ProfileImage {
  path: string; // e.g., "images/1234567890-profile.jpg"
  url: string; // e.g., "http://localhost:5000/images/1234567890-profile.jpg"
}

export interface IUser {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  phoneNumber: string;
  address?: string; //
  profileImage?: string;
  role: "office_admin" | "worker" | "admin";
  experience?: number;
  expertiseArea?: string;
  employmentType?: "Full-time" | "Part-time" | "Contract";
  fcmToken?: string[];
  // Auth / verification
  isActive?: boolean;
  otp?: string;
  expiresAt?: Date;
  isVerified?: boolean;
  isCompanyAdded: boolean;
  // Subscription (admin-related)
  currentSubscriptionId?: Types.ObjectId | IUserSubscription;
  hasActiveSubscription?: boolean;
  isDeleted?: boolean;
  passwordChangedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserInterface extends Model<IUser> {
  isUserExistByEmail(email: string): Promise<IUser>;
  compareUserPassword(
    payloadPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  newHashedPassword(newPassword: string): Promise<string>;
  isOldTokenValid: (
    passwordChangedTime: Date,
    jwtIssuedTime: number,
  ) => Promise<boolean>;
  isJwtIssuedBeforePasswordChange(
    passwordChangeTimeStamp: Date,
    jwtIssuedTimeStamp: number,
  ): boolean;
  isUserExistByCustomId(email: string): Promise<IUser>;
}
