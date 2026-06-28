import { clerkClient } from "@clerk/nextjs/server";

export const FREE_MESSAGE_LIMIT = 8;

export async function getTrainerAccess(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const premium = user.publicMetadata?.premium === true;
  const freeMessagesUsed = Number(user.publicMetadata?.freeMessagesUsed ?? 0);
  const freeMessagesRemaining = Math.max(FREE_MESSAGE_LIMIT - freeMessagesUsed, 0);

  return {
    premium,
    freeMessagesUsed,
    freeMessagesRemaining,
    hasAccess: premium || freeMessagesUsed < FREE_MESSAGE_LIMIT,
  };
}

export async function incrementFreeMessageUsage(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const premium = user.publicMetadata?.premium === true;
  if (premium) return;

  const currentUsed = Number(user.publicMetadata?.freeMessagesUsed ?? 0);
  const nextUsed = currentUsed + 1;

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      freeMessagesUsed: nextUsed,
    },
  });
}