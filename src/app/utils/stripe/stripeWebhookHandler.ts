/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { stripe } from "./stripe";
import config from "../../config";

// webhook.ts
export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = config.STRIPE_WEBHOOK_SECRET as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    /*
     * TESTING: Skipped — subscription is activated directly in the service.
     *
     * TO ENABLE FOR PRODUCTION:
     *   1. Remove the early return below
     *   2. Make sure buyPremiumPlan() is NOT called in subscription.service.ts
     *   3. This becomes the only place subscription is activated
     */
    console.log(
      "Webhook received but skipped — handled directly in service for testing.",
    );
    return res.json({ received: true }); // remove this line in production

    // ─── PRODUCTION (remove the return above, uncomment below) ────────
    // const paymentIntent = event.data.object;
    // const { userId, planId } = paymentIntent.metadata;
    // if (userId && planId) {
    //   const user = await UserModel.findById(userId);
    //   if (user && !user.hasActiveSubscription) {
    //     await buyPremiumPlan(planId, userId);
    //   }
    // }
    // ─── END PRODUCTION ───────────────────────────────────────────────
  }

  res.json({ received: true });
};
