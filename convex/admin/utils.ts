import { QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import { getCurrentUserId } from "../pets/utils";

/**
 * Check if a user is a platform owner
 * @param ctx Query context
 * @param userId User ID to check (if not provided, checks current user)
 * @returns true if user is a platform owner, false otherwise
 */
export async function isPlatformOwner(
  ctx: QueryCtx,
  userId?: string
): Promise<boolean> {
  const userIdToCheck = userId ?? (await getCurrentUserId(ctx));
  
  if (!userIdToCheck) {
    return false;
  }

  const platformOwner = await ctx.db
    .query("platformOwners")
    .withIndex("by_userId", (q) => q.eq("userId", userIdToCheck))
    .first();

  return platformOwner !== null;
}

/**
 * Require platform owner status - throws error if user is not a platform owner
 * @param ctx Query context
 * @returns User ID of the platform owner
 */
export async function requirePlatformOwner(ctx: QueryCtx): Promise<string> {
  const userId = await getCurrentUserId(ctx);
  
  if (!userId) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  }

  const isOwner = await isPlatformOwner(ctx, userId);
  
  if (!isOwner) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Platform owner access required",
    });
  }

  return userId;
}
