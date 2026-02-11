import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";
import {
  SubscriptionPlanModel,
  UserSubscriptionModel,
} from "./subscription.model";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ISubscriptionPlan } from "./subscription.interface";

const createSubscriptionPlan = async (payload: ISubscriptionPlan) => {
  /* ------------------ Check if plan already exists ------------------ */
  const isPlanExist = await SubscriptionPlanModel.findOne({
    name: payload.name,
  });

  if (isPlanExist) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Subscription plan with this name already exists",
    );
  }

  /* ------------------ Create subscription plan ------------------ */
  const newPlan = await SubscriptionPlanModel.create(payload);

  if (!newPlan) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Failed to create subscription plan",
    );
  }

  return {
    plan: newPlan,
    message: "Subscription plan created successfully",
  };
};

const freeTrialPlan = async (user: JwtPayload) => {
  const userId = user.user;

  /* ------------------ Check if user exists ------------------ */
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  /* ------------------ Check if user already has active subscription ------------------ */
  if (isUserExist.hasActiveSubscription) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You already have an active subscription",
    );
  }

  /* ------------------ Check if email has used trial before ------------------ */
  const hasUsedTrial = await UserSubscriptionModel.findOne({
    userId: userId,
    isTrialUsed: true,
  });

  if (hasUsedTrial) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You have already used the free trial. Please purchase a subscription.",
    );
  }

  /* ------------------ Start transaction ------------------ */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ------------------ Create 15-day trial subscription ------------------ */
    const trialStartDate = new Date();
    const trialEndDate = new Date(
      trialStartDate.getTime() + 15 * 24 * 60 * 60 * 1000,
    );

    const trialSubscription = await UserSubscriptionModel.create(
      [
        {
          userId: userId,
          subscriptionType: "trial",
          status: "active",
          isTrialUsed: true,
          trialStartDate,
          trialEndDate,
          maxProjects: 5,
          maxMembers: 25,
          storageLimit: 50,
          autoRenew: false,
        },
      ],
      { session },
    );

    if (!trialSubscription || trialSubscription.length === 0) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Failed to activate trial subscription",
      );
    }

    /* ------------------ Update existing user with subscription ------------------ */
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        currentSubscriptionId: trialSubscription[0]._id,
        hasActiveSubscription: true,
      },
      { session, new: true },
    ).select("-password -otp");

    if (!updatedUser) {
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }

    /* ------------------ Commit transaction ------------------ */
    await session.commitTransaction();

    /* ------------------ Return response ------------------ */
    return {
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        hasActiveSubscription: updatedUser.hasActiveSubscription,
      },
      subscription: {
        type: "trial",
        status: "active",
        startDate: trialStartDate,
        endDate: trialEndDate,
        daysRemaining: 15,
        limits: {
          maxProjects: 5,
          maxMembers: 25,
          storageLimit: 50,
        },
      },
      message:
        "Free trial activated successfully! Enjoy 15 days of premium access.",
    };
  } catch (error) {
    /* ------------------ Rollback on error ------------------ */
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const buyPremiumPlan = async (planId: string, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  /* ------------------ Find the subscription plan ------------------ */
  const plan = await SubscriptionPlanModel.findById(planId);
  if (!plan) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "Subscription plan not found or inactive",
    );
  }

  /* ------------------ Check if user exists ------------------ */
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  /* ------------------ Check if user already has active subscription ------------------ */
  if (isUserExist.hasActiveSubscription) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You already have an active subscription. Please cancel or wait for it to expire.",
    );
  }

  /* ------------------ Start transaction ------------------ */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ------------------ Create premium subscription ------------------ */
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date(
      subscriptionStartDate.getTime() + plan.duration * 24 * 60 * 60 * 1000,
    );

    const premiumSubscription = await UserSubscriptionModel.create(
      [
        {
          userId: userId,
          planId: plan._id,
          subscriptionType: "paid",
          status: "active",
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate,
          amount: plan.price,
          maxProjects: 100, // Adjust based on your premium limits
          maxMembers: 100, // Adjust based on your premium limits
          storageLimit: 500, // Adjust based on your premium limits
          autoRenew: false,
        },
      ],
      { session },
    );

    if (!premiumSubscription || premiumSubscription.length === 0) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Failed to activate premium subscription",
      );
    }

    /* ------------------ Update user with subscription ------------------ */
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        currentSubscriptionId: premiumSubscription[0]._id,
        hasActiveSubscription: true,
      },
      { session, new: true },
    ).select("-password -otp");

    if (!updatedUser) {
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }

    /* ------------------ Commit transaction ------------------ */
    await session.commitTransaction();

    /* ------------------ Return response ------------------ */
    const daysRemaining = Math.ceil(
      (subscriptionEndDate.getTime() - subscriptionStartDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        hasActiveSubscription: updatedUser.hasActiveSubscription,
      },
      subscription: {
        type: "premium",
        planName: plan.name,
        status: "active",
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        daysRemaining,
        amount: plan.price,
        limits: {
          maxProjects: 100,
          maxMembers: 100,
          storageLimit: 500,
        },
      },
      message: `${plan.name} premium plan activated successfully!`,
    };
  } catch (error) {
    /* ------------------ Rollback on error ------------------ */
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const subscriptionServices = {
  createSubscriptionPlan,
  freeTrialPlan,
  buyPremiumPlan,
};
