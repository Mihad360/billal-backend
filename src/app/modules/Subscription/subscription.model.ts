import { Schema, model } from "mongoose";
import { ISubscriptionPlan, IUserSubscription } from "./subscription.interface";

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: Number, // days
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    yearlyPrice: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      min: 0,
      max: 100,
    },

    features: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const SubscriptionPlanModel = model<ISubscriptionPlan>(
  "SubscriptionPlan",
  subscriptionPlanSchema,
);

const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    },

    subscriptionType: {
      type: String,
      enum: ["trial", "paid"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
    },

    // Trial
    isTrialUsed: {
      type: Boolean,
      default: false,
    },
    trialStartDate: Date,
    trialEndDate: Date,

    // Paid
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false,
    },

    // Payment
    paymentMethod: String,
    transactionId: String,
    amountPaid: Number,

    // Limits
    maxProjects: {
      type: Number,
      required: true,
    },
    maxMembers: {
      type: Number,
      required: true,
    },
    storageLimit: {
      type: Number, // MB
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const UserSubscriptionModel = model<IUserSubscription>(
  "UserSubscription",
  userSubscriptionSchema,
);
