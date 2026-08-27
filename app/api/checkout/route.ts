import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  PREMIUM_SUBSCRIPTION_CURRENCY,
  PREMIUM_SUBSCRIPTION_PRICE_CENTS,
  PREMIUM_SUBSCRIPTION_PRICE_ID,
} from "@/lib/subscriptionPricing";
import { absoluteUrl } from "@/lib/site";
import { recordPromotionalTrialUpgradeCtaClick } from "@/lib/promotionalTrialConversions";
import { getBlockingSubscription, getOpenSubscriptionCheckout, resolveStripeCustomer } from "@/lib/stripeCustomer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const { customer } = await resolveStripeCustomer(stripe, userId);
    const blockingSubscription = await getBlockingSubscription(stripe, customer.id);

    if (blockingSubscription || user.publicMetadata?.premium === true) {
      return NextResponse.json({
        error: "You already have an active Premium subscription. Manage it from your dashboard.",
        code: "already_subscribed",
        manageSubscription: true,
      }, { status: 409 });
    }

    // Attribution is only for a real checkout attempt; a subscription that is
    // already active must not add conversion-funnel activity.
    try {
      await recordPromotionalTrialUpgradeCtaClick(userId);
    } catch (error) {
      console.error("Promotional trial upgrade CTA tracking failed", error);
    }

    const openCheckout = await getOpenSubscriptionCheckout(stripe, customer.id);
    if (openCheckout?.url) {
      return NextResponse.json({ url: openCheckout.url, reusedCheckout: true });
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
      customer: customer.id,
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
    }, {
      idempotencyKey: `patriot-k9-checkout-${userId}-${customer.id}-${Math.floor(Date.now() / 300_000)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Unable to verify your subscription status. Please try again." },
      { status: 500 }
    );
  }
}
