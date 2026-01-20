import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { Doc } from "../_generated/dataModel";
import { authComponent } from "../auth";
import { ConvexError } from "convex/values";

/**
 * Generate a base slug from pet name
 * Normalizes the name: lowercase, trim, replace spaces/hyphens with single hyphen,
 * remove special characters, limit to 50 characters
 */
export function generateSlug(name: string): string {
  // Normalize: lowercase, trim whitespace
  let slug = name.toLowerCase().trim();

  // Replace spaces and multiple hyphens with single hyphen
  slug = slug.replace(/[\s\-_]+/g, "-");

  // Remove special characters (keep alphanumeric and hyphens only)
  slug = slug.replace(/[^a-z0-9-]/g, "");

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "");

  // Limit to 50 characters (truncate if needed)
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
    // Remove trailing hyphen if truncation created one
    slug = slug.replace(/-+$/, "");
  }

  // Generate random suffix: 4-6 character alphanumeric (lowercase)
  const randomSuffix = generateRandomSuffix(4);

  return `${slug}-${randomSuffix}`;
}

/**
 * Generate a random alphanumeric suffix
 */
function generateRandomSuffix(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Ensure slug is unique by checking against existing slugs
 * If exists, append additional random suffix and retry (max 5 attempts)
 */
export async function ensureUniqueSlug(
  ctx: QueryCtx,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const existing = await ctx.db
      .query("pets")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!existing) {
      return slug; // Slug is unique
    }

    // Collision detected, append additional random suffix
    const additionalSuffix = generateRandomSuffix(2);
    slug = `${baseSlug}-${additionalSuffix}`;
    attempts++;
  }

  // If we've exhausted attempts, append timestamp as fallback
  const timestamp = Date.now().toString(36).slice(-4);
  return `${baseSlug}-${timestamp}`;
}

/**
 * Get current authenticated user ID from Better Auth
 * Returns user ID string or null if unauthenticated
 */
export async function getCurrentUserId(
  ctx: QueryCtx
): Promise<string | null> {
  // Convex identity is the most reliable source of the authenticated subject.
  // With Better Auth + Convex, `identity.subject` is the stable user id string
  // we store in `pets.ownerUserId` and `petMembers.userId`.
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject) return identity.subject;

  // Fallback: attempt to read id fields from the Better Auth user object.
  const user = await authComponent.getAuthUser(ctx);
  const u = user as { userId?: string | null; id?: string | null } | null;
  return u?.userId ?? u?.id ?? null;
}

/**
 * Require current user - throws error if not authenticated
 * Returns user ID string
 */
export async function requireCurrentUser(ctx: QueryCtx): Promise<string> {
  const userId = await getCurrentUserId(ctx);
  if (!userId) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  }
  return userId;
}

/**
 * Get user's membership/role for a pet
 * Returns role and primary owner flag
 */
export async function getPetMembership(
  ctx: QueryCtx,
  petId: Id<"pets">,
  userId: string
): Promise<{ role: "owner" | "guardian" | "viewer" | null; isPrimaryOwner: boolean }> {
  // Load pet to check primary owner
  const pet = await ctx.db.get(petId);
  if (!pet) {
    return { role: null, isPrimaryOwner: false };
  }

  // Check if user is primary owner
  if (pet.ownerUserId === userId) {
    return { role: "owner", isPrimaryOwner: true };
  }

  // Check petMembers table for additional memberships
  const membership = await ctx.db
    .query("petMembers")
    .withIndex("by_petId_and_userId", (q) =>
      q.eq("petId", petId).eq("userId", userId)
    )
    .first();

  if (membership) {
    return { role: membership.role, isPrimaryOwner: false };
  }

  return { role: null, isPrimaryOwner: false };
}

/**
 * Check if user can edit a pet
 * Returns true if user is owner or guardian, false otherwise
 */
export async function canEditPet(
  ctx: QueryCtx,
  petId: Id<"pets">,
  userId: string
): Promise<boolean> {
  const membership = await getPetMembership(ctx, petId, userId);
  return (
    membership.isPrimaryOwner ||
    membership.role === "owner" ||
    membership.role === "guardian"
  );
}

/**
 * Check if user can view a pet
 * Supports public access if allowPublic is true
 */
export async function canViewPet(
  ctx: QueryCtx,
  petId: Id<"pets">,
  userId: string | null,
  allowPublic: boolean = false
): Promise<boolean> {
  // Load pet to check public access
  const pet = await ctx.db.get(petId);
  if (!pet) {
    return false;
  }

  // If allowPublic is true, check shareSettings
  if (allowPublic && pet.shareSettings.allowPublicProfile) {
    return true;
  }

  // If no user, cannot view (unless public)
  if (!userId) {
    return false;
  }

  // Check membership (any role grants view access)
  const membership = await getPetMembership(ctx, petId, userId);
  return membership.isPrimaryOwner || membership.role !== null;
}

/**
 * Check if pet profile is publicly accessible
 */
export function isPublicPet(pet: Doc<"pets">): boolean {
  return pet.shareSettings.allowPublicProfile === true;
}
