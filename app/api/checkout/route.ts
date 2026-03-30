import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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
          price: "price_1TGSfOIwtcreLQm5nr7T8kfI",
          quantity: 1,
        },
      ],
      success_url: "https://train.hapticvets.com/success",
      cancel_url: "https://train.hapticvets.com/cancel",
      metadata: {
        clerkUserId: userId,
        plan: "premium",
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