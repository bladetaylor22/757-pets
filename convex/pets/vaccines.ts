import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireCurrentUser, canEditPet, canViewPet } from "./utils";

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add structured vaccine record
 */
export const addVaccineRecord = mutation({
  args: {
    petId: v.id("pets"),
    vaccineType: v.union(
      v.literal("rabies"),
      v.literal("dhpp"),
      v.literal("fvrcp"),
      v.literal("bordetella"),
      v.literal("lyme"),
      v.literal("other")
    ),
    administeredAt: v.number(), // Unix timestamp
    expiresAt: v.optional(v.union(v.number(), v.null())),
    providerName: v.optional(v.union(v.string(), v.null())),
    documentFileId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to add vaccine records for this pet",
      });
    }

    // Validate dates
    const now = Date.now();
    if (args.administeredAt > now) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Administered date cannot be in the future",
      });
    }

    if (args.expiresAt !== undefined && args.expiresAt !== null) {
      if (args.expiresAt <= args.administeredAt) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Expiration date must be after administered date",
        });
      }
    }

    // Verify document file exists if provided
    if (args.documentFileId) {
      const fileMetadata = await ctx.db.system.get(args.documentFileId);
      if (!fileMetadata) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Document file not found in storage",
        });
      }
    }

    // Insert vaccine record
    const recordId = await ctx.db.insert("petVaccineRecords", {
      petId: args.petId,
      vaccineType: args.vaccineType,
      administeredAt: args.administeredAt,
      expiresAt: args.expiresAt ?? null,
      providerName: args.providerName ?? null,
      documentFileId: args.documentFileId ?? null,
      createdAt: Date.now(),
    });

    return await ctx.db.get(recordId);
  },
});

/**
 * Update vaccine record
 */
export const updateVaccineRecord = mutation({
  args: {
    recordId: v.id("petVaccineRecords"),
    updates: v.object({
      vaccineType: v.optional(
        v.union(
          v.literal("rabies"),
          v.literal("dhpp"),
          v.literal("fvrcp"),
          v.literal("bordetella"),
          v.literal("lyme"),
          v.literal("other")
        )
      ),
      administeredAt: v.optional(v.number()),
      expiresAt: v.optional(v.union(v.number(), v.null())),
      providerName: v.optional(v.union(v.string(), v.null())),
      documentFileId: v.optional(v.union(v.id("_storage"), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Load record to get associated petId
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vaccine record not found",
      });
    }

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, record.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to update this vaccine record",
      });
    }

    // Validate updated dates if provided
    const administeredAt =
      args.updates.administeredAt ?? record.administeredAt;
    const expiresAt = args.updates.expiresAt ?? record.expiresAt;

    if (args.updates.administeredAt !== undefined) {
      const now = Date.now();
      if (administeredAt > now) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Administered date cannot be in the future",
        });
      }
    }

    if (expiresAt !== null && expiresAt !== undefined) {
      if (expiresAt <= administeredAt) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Expiration date must be after administered date",
        });
      }
    }

    // Verify document file exists if provided
    if (args.updates.documentFileId !== undefined && args.updates.documentFileId !== null) {
      const fileMetadata = await ctx.db.system.get(args.updates.documentFileId);
      if (!fileMetadata) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Document file not found in storage",
        });
      }
    }

    // Update record
    await ctx.db.patch(args.recordId, args.updates);

    return await ctx.db.get(args.recordId);
  },
});

/**
 * Remove vaccine record
 */
export const deleteVaccineRecord = mutation({
  args: { recordId: v.id("petVaccineRecords") },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Load record to get associated petId
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vaccine record not found",
      });
    }

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, record.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to delete this vaccine record",
      });
    }

    // Delete record
    await ctx.db.delete(args.recordId);

    return { success: true };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all vaccine records for a pet
 */
export const getPetVaccineRecords = query({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can view pet
    const canView = await canViewPet(ctx, args.petId, userId, false);
    if (!canView) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to view this pet's vaccine records",
      });
    }

    // Query vaccine records
    const records = await ctx.db
      .query("petVaccineRecords")
      .withIndex("by_petId", (q) => q.eq("petId", args.petId))
      .collect();

    // Sort by administeredAt descending (most recent first)
    records.sort((a, b) => b.administeredAt - a.administeredAt);

    return records;
  },
});

/**
 * Get vaccines expiring soon (for alerts)
 */
export const getUpcomingExpirations = query({
  args: {
    petId: v.optional(v.id("pets")),
    daysAhead: v.optional(v.number()), // Default: 30 days
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    const daysAhead = args.daysAhead ?? 30;
    const threshold = Date.now() + daysAhead * 24 * 60 * 60 * 1000;

    let records;

    if (args.petId) {
      // If petId provided, verify can view pet
      const petId = args.petId; // Narrow type
      const canView = await canViewPet(ctx, petId, userId, false);
      if (!canView) {
        throw new ConvexError({
          code: "UNAUTHORIZED",
          message: "You do not have permission to view this pet's vaccine records",
        });
      }

      // Query vaccine records for specific pet
      records = await ctx.db
        .query("petVaccineRecords")
        .withIndex("by_petId", (q) => q.eq("petId", petId))
        .collect();
    } else {
      // Get all pets user has access to
      const ownedPets = await ctx.db
        .query("pets")
        .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", userId))
        .collect();

      const memberships = await ctx.db
        .query("petMembers")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      const petIds = [
        ...ownedPets.map((p) => p._id),
        ...memberships.map((m) => m.petId),
      ];

      // Get unique pet IDs (using Set with string comparison)
      const uniquePetIds = Array.from(
        new Map(petIds.map((id) => [id.toString(), id])).values()
      );

      // Query vaccine records for all accessible pets
      const allRecords = await Promise.all(
        uniquePetIds.map(async (petId) => {
          return await ctx.db
            .query("petVaccineRecords")
            .withIndex("by_petId", (q) => q.eq("petId", petId))
            .collect();
        })
      );

      records = allRecords.flat();
    }

    // Filter records where expiresAt is not null and expiresAt <= threshold
    const expiringRecords = records.filter(
      (record) =>
        record.expiresAt !== null &&
        record.expiresAt !== undefined &&
        record.expiresAt <= threshold
    );

    // Sort by expiration date (soonest first)
    expiringRecords.sort((a, b) => {
      const aExpires = a.expiresAt ?? Infinity;
      const bExpires = b.expiresAt ?? Infinity;
      return aExpires - bExpires;
    });

    return expiringRecords;
  },
});
