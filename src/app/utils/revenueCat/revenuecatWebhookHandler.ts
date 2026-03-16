import { Request, Response } from "express";

export const revenuecatWebhookHandler = async (req: Request, res: Response) => {
  console.log("🔥 RevenueCat webhook hit!");
  // 1. Verify authorization header
  const authHeader = req.headers["authorization"] as string;
  const expected = `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`;

  if (authHeader !== expected) {
    console.log("❌ Unauthorized - header mismatch");
    console.log("Received:", authHeader);
    console.log("Expected:", expected);
    return res.status(401).send("Unauthorized");
  }

  // 2. Parse body
  const rawBody = req.body as Buffer;
  const body = JSON.parse(rawBody.toString());
  const event = body.event;
  const { type, app_user_id, environment } = event;
  console.log(body);
  console.log(`📩 ${type} | User: ${app_user_id} | Env: ${environment}`);

  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
      await grantAccess(app_user_id);
      break;
    case "CANCELLATION":
    case "EXPIRATION":
    case "BILLING_ISSUE":
      await revokeAccess(app_user_id);
      break;
    case "TEST":
      console.log("✅ RevenueCat test webhook received!");
      break;
    default:
      console.log(`⚠️ Unhandled event: ${type}`);
  }

  res.status(200).send("OK");
};

async function grantAccess(userId: string) {
  console.log(`✅ GRANT access → ${userId}`);
}

async function revokeAccess(userId: string) {
  console.log(`❌ REVOKE access → ${userId}`);
}
