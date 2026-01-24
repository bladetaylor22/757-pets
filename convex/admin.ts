import { query, internalMutation, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePlatformOwner, isPlatformOwner } from "./admin/utils";
import { getCurrentUserId } from "./pets/utils";
import { authComponent } from "./auth";
import { internal, api, components } from "./_generated/api";

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
 * Returns list of platform owner records with user names
 * Note: User names are fetched via a separate action call due to Better Auth internal API limitations
 */
export const getPlatformOwners = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformOwner(ctx);
    
    const owners = await ctx.db
      .query("platformOwners")
      .collect();
    
    // Return owners - user names will be enriched by getPlatformOwnersWithNames action
    return owners.map((owner) => ({
      _id: owner._id,
      userId: owner.userId,
      createdAt: owner.createdAt,
    }));
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
// ACTIONS
// ============================================================================

/**
 * Get all platform owners with user names enriched from Better Auth
 * This is an action because we need to call internal Better Auth queries
 */
export const getPlatformOwnersWithNames = action({
  args: {},
  handler: async (ctx): Promise<Array<{
    _id: string;
    userId: string;
    userName: string;
    userEmail: string | null;
    createdAt: number;
  }>> => {
    // Check authorization - use regular query API, not internal
    const isOwner = await ctx.runQuery(api.admin.isCurrentUserPlatformOwner);
    if (!isOwner) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Platform owner access required",
      });
    }
    
    // Get platform owners
    const owners: Array<{
      _id: string;
      userId: string;
      createdAt: number;
    }> = await ctx.runQuery(internal.admin._getPlatformOwnersList);
    
    // Enrich with Better Auth user data
    const ownersWithUserData: Array<{
      _id: string;
      userId: string;
      userName: string;
      userEmail: string | null;
      createdAt: number;
    }> = await Promise.all(
      owners.map(async (owner: {
        _id: string;
        userId: string;
        createdAt: number;
      }) => {
        try {
          // Use internal query to get Better Auth user.
          // The stored userId may map to either `userId` or `_id` in Better Auth.
          type BetterAuthUser = {
            name?: string | null;
            email?: string | null;
            userId?: string | null;
            _id?: string | null;
          } | null;
          let user: BetterAuthUser = await ctx.runQuery(components.betterAuth.adapter.findOne, {
            model: "user",
            where: [
              {
                field: "userId",
                operator: "eq",
                value: owner.userId,
              },
            ],
          });

          if (!user) {
            user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
              model: "user",
              where: [
                {
                  field: "_id",
                  operator: "eq",
                  value: owner.userId,
                },
              ],
            });
          }
          
          return {
            _id: owner._id,
            userId: owner.userId,
            userName: user?.name || user?.email || owner.userId,
            userEmail: user?.email || null,
            createdAt: owner.createdAt,
          };
        } catch (error) {
          console.error("Error fetching user for platform owner:", owner.userId, error);
          return {
            _id: owner._id,
            userId: owner.userId,
            userName: owner.userId,
            userEmail: null,
            createdAt: owner.createdAt,
          };
        }
      })
    );
    
    return ownersWithUserData;
  },
});

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

/**
 * Internal query to get platform owners list
 */
export const _getPlatformOwnersList = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{
    _id: string;
    userId: string;
    createdAt: number;
  }>> => {
    return await ctx.db.query("platformOwners").collect();
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
