import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { recordPromotionalTrialPremiumConversion } from "@/lib/promotionalTrialConversions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerkUserId;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;

      if (clerkUserId) {
        const client = await clerkClient();
        await client.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            premium: true,
            plan: "premium",
          },
          privateMetadata: stripeCustomerId
            ? {
                stripeCustomerId,
              }
            : undefined,
        });
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkUserId = subscription.metadata?.clerkUserId;

      if (clerkUserId) {
        const isActive =
          subscription.status === "active" || subscription.status === "trialing";

        // Existing entitlement behavior is driven by checkout completion and
        // subscription updates/deletions. A created event is only added here
        // to capture a newly active paid subscription for trial attribution.
        if (event.type !== "customer.subscription.created") {
          const client = await clerkClient();
          await client.users.updateUserMetadata(clerkUserId, {
            publicMetadata: {
              premium: isActive,
              plan: isActive ? "premium" : "free",
            },
          });
        }

        if (subscription.status === "active") {
          try {
            await recordPromotionalTrialPremiumConversion({
              userId: clerkUserId,
              stripeSubscriptionId: subscription.id,
            });
          } catch (error) {
            // Keep Stripe's entitlement webhook reliable even if optional
            // promotional-trial attribution cannot be recorded.
            console.error("Promotional trial paid conversion tracking failed", error);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
