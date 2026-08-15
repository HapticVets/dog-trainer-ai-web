import { auth, clerkClient } from "@clerk/nextjs/server";

export class AdminAuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Authentication is required." : "Administrator access is required.");
    this.name = "AdminAuthorizationError";
  }
}

export const isAdmin = (role: unknown) => role === "admin";

export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw new AdminAuthorizationError(401);
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  if (!isAdmin(user.publicMetadata?.role)) {
    throw new AdminAuthorizationError(403);
  }

  return userId;
}

// Phase 1 scopes internal records to the creating admin. This helper is the
// single seam for introducing a shared-admin workspace later.
export async function requireAdminWorkspace() {
  return { ownerId: await requireAdmin() };
}
