/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { SubscriptionPlanModel } from "../Subscription/subscription.model";
import { stripe } from "../../utils/stripe/stripe";
import { Types } from "mongoose";

export const createPaymentIntent = async (
  userId: string | Types.ObjectId,
  planId: string | Types.ObjectId,
  type: "monthly" | "yearly" = "monthly",
) => {
  const plan = await SubscriptionPlanModel.findById(planId);
  if (!plan || !plan.isActive) {
    throw new AppError(HttpStatus.NOT_FOUND, "Plan not found or inactive");
  }

  let amount = type === "yearly" ? plan.yearlyPrice : plan.price;
  if (plan.discount && plan.discount > 0) {
    amount = amount - (amount * plan.discount) / 100;
  }

  const stripeAmount = Math.round(amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmount,
    currency: "usd",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: {
      userId: userId.toString(),
      planId: plan._id.toString(),
      type,
    },
  });

  // ✅ Just return the intent — don't confirm here anymore
  return {
    paymentIntentId: paymentIntent.id,
    amount,
    currency: "usd",
  };
};

export const confirmPayment = async (clientSecret: string) => {
  try {
    // Confirm the PaymentIntent using the test payment method
    const paymentIntent = await stripe.paymentIntents.confirm(clientSecret, {
      payment_method: "pm_card_visa",
    });
    return paymentIntent;
  } catch (err: any) {
    console.log(err);
    throw new AppError(HttpStatus.BAD_REQUEST, "Payment intent failed");
  }
};
