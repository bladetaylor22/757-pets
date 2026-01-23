import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePlatformOwner, isPlatformOwner } from "./admin/utils";
import { getCurrentUserId } from "./pets/utils";
import { authComponent } from "./auth";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Check if the current user is a platform owner
 */
export const isCurrentUserPlatformOwner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return false;
    }
    return await isPlatformOwner(ctx, userId);
  },
});

/**
 * Get all platform owners (admin only)
 * Returns list of platform owner records
 */
export const getPlatformOwners = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformOwner(ctx);
    
    const owners = await ctx.db
      .query("platformOwners")
      .collect();
    
    // Enrich with user data from Better Auth
    const ownersWithUserData = await Promise.all(
      owners.map(async (owner) => {
        try {
          // Try to get user data - Better Auth users are stored in component tables
          // We'll return the owner record with userId for now
          return {
            _id: owner._id,
            userId: owner.userId,
            createdAt: owner.createdAt,
          };
        } catch {
          return {
            _id: owner._id,
            userId: owner.userId,
            createdAt: owner.createdAt,
          };
        }
      })
    );
    
    return ownersWithUserData;
  },
});

/**
 * Get platform statistics (admin only)
 * Returns counts and stats about the platform
 */
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformOwner(ctx);
    
    // Get pet counts by status
    const activePets = await ctx.db
      .query("pets")
      .withIndex("by_ownerUserId")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const archivedPets = await ctx.db
      .query("pets")
      .withIndex("by_ownerUserId")
      .filter((q) => q.eq(q.field("status"), "archived"))
      .collect();
    
    const deceasedPets = await ctx.db
      .query("pets")
      .withIndex("by_ownerUserId")
      .filter((q) => q.eq(q.field("status"), "deceased"))
      .collect();
    
    // Get unique pet owners
    const allPets = await ctx.db
      .query("pets")
      .collect();
    const uniqueOwners = new Set(allPets.map((pet) => pet.ownerUserId));
    
    // Get pet members count
    const petMembers = await ctx.db
      .query("petMembers")
      .collect();
    const uniqueMembers = new Set(petMembers.map((m) => m.userId));
    
    // Get platform owners count
    const platformOwners = await ctx.db
      .query("platformOwners")
      .collect();
    
    // Get files count
    const files = await ctx.db
      .query("petFiles")
      .collect();
    
    // Get vaccine records count
    const vaccineRecords = await ctx.db
      .query("petVaccineRecords")
      .collect();
    
    return {
      pets: {
        total: allPets.length,
        active: activePets.length,
        archived: archivedPets.length,
        deceased: deceasedPets.length,
      },
      users: {
        uniquePetOwners: uniqueOwners.size,
        uniquePetMembers: uniqueMembers.size,
        platformOwners: platformOwners.length,
      },
      content: {
        files: files.length,
        vaccineRecords: vaccineRecords.length,
      },
    };
  },
});

/**
 * Get current user info (for admin dashboard)
 * Returns current user data if they are a platform owner
 */
export const getCurrentAdminUser = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformOwner(ctx);
    
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }
    
    const userId = await getCurrentUserId(ctx);
    const isOwner = userId ? await isPlatformOwner(ctx, userId) : false;
    
    return {
      ...user,
      isPlatformOwner: isOwner,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Internal mutation to add a platform owner
 * This should be called manually via Convex dashboard or internal functions only
 */
export const setPlatformOwner = internalMutation({
  args: {
    userId: v.string(),
    isOwner: v.boolean(), // true to add, false to remove
  },
  handler: async (ctx, args) => {
    if (args.isOwner) {
      // Check if already exists
      const existing = await ctx.db
        .query("platformOwners")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      if (existing) {
        // Already exists, do nothing
        return { success: true, action: "already_exists" };
      }
      
      // Add platform owner
      await ctx.db.insert("platformOwners", {
        userId: args.userId,
        createdAt: Date.now(),
      });
      
      return { success: true, action: "added" };
    } else {
      // Remove platform owner
      const existing = await ctx.db
        .query("platformOwners")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      if (!existing) {
        return { success: true, action: "not_found" };
      }
      
      await ctx.db.delete(existing._id);
      return { success: true, action: "removed" };
    }
  },
});
