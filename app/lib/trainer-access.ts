import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const FREE_AI_CHAT_LIMIT = 3;
export const FREE_FIRST_SESSION_LIMIT = 1;
export const FREE_SESSION_LOG_LIMIT = 1;
export const FREE_DOG_PROFILE_LIMIT = 1;

export type TrainerAccess = {
  premium: boolean;
  freeMessagesUsed: number;
  freeMessagesRemaining: number;
  aiChatMessagesUsed: number;
  aiChatMessagesRemaining: number;
  firstSessionsGenerated: number;
  sessionLogsUsed: number;
  nextSessionsGenerated: number;
  dogProfilesUsed: number;
  canCreateCaseFile: boolean;
  canGenerateFirstSession: boolean;
  canLogSession: boolean;
  canUseAiChat: boolean;
  canGenerateNextSession: boolean;
  hasAccess: boolean;
};

export async function getTrainerAccess(userId: string): Promise<TrainerAccess> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const premium = user.publicMetadata?.premium === true;

  const [
    chatCountResult,
    initialSessionCountResult,
    nextSessionCountResult,
    sessionLogCountResult,
    dogProfileCountResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("dog_chats")
      .select("*", { count: "exact", head: true })
      .eq("clerk_user_id", userId)
      .eq("role", "user"),
    supabaseAdmin
      .from("dog_outputs")
      .select("*", { count: "exact", head: true })
      .eq("clerk_user_id", userId)
      .eq("output_type", "initial_session_plan"),
    supabaseAdmin
      .from("dog_outputs")
      .select("*", { count: "exact", head: true })
      .eq("clerk_user_id", userId)
      .eq("output_type", "next_session_plan"),
    supabaseAdmin
      .from("session_logs")
      .select("*", { count: "exact", head: true })
      .eq("clerk_user_id", userId),
    supabaseAdmin
      .from("dog_profiles")
      .select("*", { count: "exact", head: true })
      .eq("clerk_user_id", userId),
  ]);

  if (chatCountResult.error) throw new Error(chatCountResult.error.message);
  if (initialSessionCountResult.error) throw new Error(initialSessionCountResult.error.message);
  if (nextSessionCountResult.error) throw new Error(nextSessionCountResult.error.message);
  if (sessionLogCountResult.error) throw new Error(sessionLogCountResult.error.message);
  if (dogProfileCountResult.error) throw new Error(dogProfileCountResult.error.message);

  const aiChatMessagesUsed = chatCountResult.count ?? 0;
  const firstSessionsGenerated = initialSessionCountResult.count ?? 0;
  const nextSessionsGenerated = nextSessionCountResult.count ?? 0;
  const sessionLogsUsed = sessionLogCountResult.count ?? 0;
  const dogProfilesUsed = dogProfileCountResult.count ?? 0;

  const aiChatMessagesRemaining = Math.max(FREE_AI_CHAT_LIMIT - aiChatMessagesUsed, 0);

  return {
    premium,
    freeMessagesUsed: aiChatMessagesUsed,
    freeMessagesRemaining: aiChatMessagesRemaining,
    aiChatMessagesUsed,
    aiChatMessagesRemaining,
    firstSessionsGenerated,
    sessionLogsUsed,
    nextSessionsGenerated,
    dogProfilesUsed,
    canCreateCaseFile: premium || dogProfilesUsed < FREE_DOG_PROFILE_LIMIT,
    canGenerateFirstSession: premium || firstSessionsGenerated < FREE_FIRST_SESSION_LIMIT,
    canLogSession: premium || sessionLogsUsed < FREE_SESSION_LOG_LIMIT,
    canUseAiChat: premium || aiChatMessagesUsed < FREE_AI_CHAT_LIMIT,
    canGenerateNextSession: premium,
    hasAccess: premium || aiChatMessagesUsed < FREE_AI_CHAT_LIMIT,
  };
}
