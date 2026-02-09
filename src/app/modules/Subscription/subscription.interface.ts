import { Types } from "mongoose";
import { IUser } from "../User/user.interface";

export interface ISubscriptionPlan {
  _id?: Types.ObjectId;
  name: string; // "1 Month", "6 Month", "12 Month"
  duration: number; // in days: 30, 180, 365
  price: number; // 150, 500, 500
  yearlyPrice: number; // 1800, 1800, 900
  discount?: number; // percentage discount (e.g., 15 for 6-month plan)
  features: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Subscription Schema
export interface IUserSubscription {
  _id?: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  planId?: Types.ObjectId | ISubscriptionPlan;
  subscriptionType: "trial" | "paid";
  status: "active" | "expired" | "cancelled" | "pending";

  // Trial specific
  isTrialUsed: boolean; // Track if user has used their 15-day trial
  trialStartDate?: Date;
  trialEndDate?: Date;

  // Paid subscription specific
  startDate?: Date;
  endDate?: Date;
  autoRenew: boolean;

  // Payment tracking
  paymentMethod?: string;
  transactionId?: string;
  amountPaid?: number;

  // Limits based on plan
  maxProjects: number; // 5 for basic, unlimited for premium
  maxMembers: number; // 25 for basic, unlimited for premium
  storageLimit: number; // in MB, 50 for basic

  createdAt?: Date;
  updatedAt?: Date;
}
