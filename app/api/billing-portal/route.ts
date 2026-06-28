import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const STRIPE_CUSTOMER_ID_KEYS = [
  "stripeCustomerId",
  "stripe_customer_id",
  "customerId",
] as const;

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const stripeCustomerIdKey = STRIPE_CUSTOMER_ID_KEYS.find((key) => {
      const value = user.privateMetadata[key];
      return typeof value === "string" && value.trim().length > 0;
    });

    const stripeCustomerId = stripeCustomerIdKey
      ? user.privateMetadata[stripeCustomerIdKey]
      : null;

    if (typeof stripeCustomerId !== "string" || !stripeCustomerId.trim()) {
      return NextResponse.json(
        {
          error:
            "No Stripe customer ID found for this account. Please contact support if you already subscribed.",
        },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: "https://train.hapticvets.com/dashboard",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
