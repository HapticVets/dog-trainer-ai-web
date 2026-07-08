import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  PREMIUM_SUBSCRIPTION_CURRENCY,
  PREMIUM_SUBSCRIPTION_PRICE_CENTS,
  PREMIUM_SUBSCRIPTION_PRICE_ID,
} from "@/lib/subscriptionPricing";
import { absoluteUrl } from "@/lib/site";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PREMIUM_SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: absoluteUrl(
        "/subscription-success?session_id={CHECKOUT_SESSION_ID}"
      ),
      cancel_url: absoluteUrl("/cancel"),
      metadata: {
        clerkUserId: userId,
        plan: "premium",
        adsFallbackValue: String(PREMIUM_SUBSCRIPTION_PRICE_CENTS),
        adsFallbackCurrency: PREMIUM_SUBSCRIPTION_CURRENCY,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
          plan: "premium",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
