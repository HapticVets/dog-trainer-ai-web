import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

const customerIdKeys = ["stripeCustomerId", "stripe_customer_id", "customerId"] as const;
const blockingSubscriptionStatuses = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
]);

type ResolvedCustomer = { customer: Stripe.Customer; email: string | null };

const isLiveCustomer = (customer: Stripe.Customer | Stripe.DeletedCustomer) => !customer.deleted;

const getCustomerEmail = (user: { primaryEmailAddress?: { emailAddress?: string | null } | null }) =>
  user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;

async function retrieveCustomer(stripe: Stripe, customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return isLiveCustomer(customer) ? customer : null;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") {
      return null;
    }
    throw error;
  }
}

export async function getBlockingSubscription(stripe: Stripe, customerId: string) {
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  return subscriptions.data.find((subscription) => blockingSubscriptionStatuses.has(subscription.status)) ?? null;
}

async function recoverCustomerByEmail({ stripe, email, userId }: { stripe: Stripe; email: string; userId: string }) {
  const customers = (await stripe.customers.list({ email, limit: 100 })).data.filter((customer) => !customer.deleted);
  if (!customers.length) return { customer: null, ambiguous: false };

  const metadataMatches = customers.filter((customer) => customer.metadata.clerkUserId === userId);
  if (metadataMatches.length === 1) return { customer: metadataMatches[0], ambiguous: false };
  if (metadataMatches.length > 1) return { customer: null, ambiguous: true };
  if (customers.length === 1) return { customer: customers[0], ambiguous: false };

  const customersWithCurrentSubscriptions = [] as Stripe.Customer[];
  for (const customer of customers) {
    const subscription = await getBlockingSubscription(stripe, customer.id);
    if (subscription) customersWithCurrentSubscriptions.push(customer);
  }

  return customersWithCurrentSubscriptions.length === 1
    ? { customer: customersWithCurrentSubscriptions[0], ambiguous: false }
    : { customer: null, ambiguous: true };
}

export async function resolveStripeCustomer(stripe: Stripe, userId: string): Promise<ResolvedCustomer> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const email = getCustomerEmail(user);
  const storedCustomerId = customerIdKeys
    .map((key) => user.privateMetadata[key])
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);

  let customer: Stripe.Customer | null = storedCustomerId
    ? await retrieveCustomer(stripe, storedCustomerId.trim())
    : null;
  if (!customer && email) {
    const recovered = await recoverCustomerByEmail({ stripe, email, userId });
    if (recovered.ambiguous) {
      throw new Error("Multiple Stripe customer records require support review before checkout can continue.");
    }
    customer = recovered.customer;
  }

  if (!customer) {
    customer = await stripe.customers.create(
      { email: email ?? undefined, metadata: { clerkUserId: userId } },
      { idempotencyKey: `patriot-k9-customer-${userId}-${Math.floor(Date.now() / 86_400_000)}` },
    );
  }

  if (user.privateMetadata.stripeCustomerId !== customer.id) {
    await clerk.users.updateUserMetadata(userId, { privateMetadata: { stripeCustomerId: customer.id } });
  }

  return { customer, email };
}

export async function getOpenSubscriptionCheckout(stripe: Stripe, customerId: string) {
  const sessions = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 });
  return sessions.data.find((session) => session.mode === "subscription" && session.url) ?? null;
}
