import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  getCurrentUserId,
  requireCurrentUser,
  canViewPet,
  canEditPet,
  isPublicPet,
  generateSlug,
  ensureUniqueSlug,
} from "./pets/utils";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get pet by ID with authorization check
 */
export const getPetById = query({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const pet = await ctx.db.get(args.petId);

    if (!pet) {
      return null;
    }

    // Check authorization
    const canView = await canViewPet(ctx, args.petId, userId, false);
    if (!canView) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to view this pet",
      });
    }

    return pet;
  },
});

/**
 * Get pet by slug (supports public access)
 * Use case: Public shareable pet profile pages (for lost pet scenarios)
 */
export const getPetBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const pet = await ctx.db
      .query("pets")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!pet) {
      return null;
    }

    const userId = await getCurrentUserId(ctx);

    // Check if public access allowed
    if (isPublicPet(pet)) {
      return pet;
    }

    // If not public, require authentication and check permissions
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "This pet profile is private",
      });
    }

    const canView = await canViewPet(ctx, pet._id, userId, false);
    if (!canView) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to view this pet",
      });
    }

    return pet;
  },
});

/**
 * List all pets for authenticated user
 * Includes pets where user is primary owner or member
 */
export const getPetsByOwner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireCurrentUser(ctx);

    // Get pets where user is primary owner
    const ownedPets = await ctx.db
      .query("pets")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", userId))
      .collect();

    // Get pets where user is a member
    const memberships = await ctx.db
      .query("petMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Get pet documents for memberships
    const memberPetIds = memberships.map((m) => m.petId);
    const memberPets = await Promise.all(
      memberPetIds.map((id) => ctx.db.get(id))
    );

    // Merge and deduplicate (filter out nulls and archived pets)
    const allPets = [
      ...ownedPets,
      ...memberPets.filter((p): p is NonNullable<typeof p> => p !== null),
    ];

    // Deduplicate by _id
    const uniquePets = Array.from(
      new Map(allPets.map((pet) => [pet._id, pet])).values()
    );

    // Filter out archived pets
    return uniquePets.filter((pet) => pet.status !== "archived");
  },
});

/**
 * Get all members of a pet
 */
export const getPetMembers = query({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    await requireCurrentUser(ctx);

    // Verify user can view pet
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }

    const canView = await canViewPet(ctx, args.petId, userId, false);
    if (!canView) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to view this pet's members",
      });
    }

    // Get pet to include primary owner
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    // Get all members
    const members = await ctx.db
      .query("petMembers")
      .withIndex("by_petId", (q) => q.eq("petId", args.petId))
      .collect();

    // Return members with primary owner included
    return [
      {
        userId: pet.ownerUserId,
        role: "owner" as const,
        isPrimaryOwner: true,
        createdAt: pet.createdAt,
      },
      ...members.map((m) => ({
        userId: m.userId,
        role: m.role,
        isPrimaryOwner: false,
        createdAt: m.createdAt,
      })),
    ];
  },
});

/**
 * Get files for a pet (respects visibility)
 */
export const getPetFiles = query({
  args: {
    petId: v.id("pets"),
    includePrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCurrentUser(ctx);

    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }

    // Verify user can view pet
    const canView = await canViewPet(ctx, args.petId, userId, false);
    if (!canView) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to view this pet's files",
      });
    }

    // Get files
    const files = await ctx.db
      .query("petFiles")
      .withIndex("by_petId", (q) => q.eq("petId", args.petId))
      .collect();

    // Filter by visibility if includePrivate is false
    const visibleFiles =
      args.includePrivate === true
        ? files
        : files.filter((f) => f.visibility === "public");

    // Get URLs for each file
    const filesWithUrls = await Promise.all(
      visibleFiles.map(async (file) => {
        const url = await ctx.storage.getUrl(file.fileId);
        return {
          ...file,
          url,
        };
      })
    );

    return filesWithUrls;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create new pet profile
 */
export const createPet = mutation({
  args: {
    name: v.string(),
    species: v.union(v.literal("dog"), v.literal("cat"), v.literal("other")),
    ownerUserId: v.optional(v.string()),
    // Optional fields
    sex: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("unknown"), v.null())
    ),
    isSpayedNeutered: v.optional(v.union(v.boolean(), v.null())),
    birthDate: v.optional(v.union(v.number(), v.null())),
    approxAgeYears: v.optional(v.union(v.number(), v.null())),
    breedPrimary: v.optional(v.union(v.string(), v.null())),
    breedSecondary: v.optional(v.union(v.string(), v.null())),
    size: v.optional(
      v.union(
        v.literal("xs"),
        v.literal("s"),
        v.literal("m"),
        v.literal("l"),
        v.literal("xl"),
        v.null()
      )
    ),
    weightLbs: v.optional(v.union(v.number(), v.null())),
    colorPrimary: v.optional(v.union(v.string(), v.null())),
    colorSecondary: v.optional(v.union(v.string(), v.null())),
    distinctiveMarks: v.optional(v.union(v.string(), v.null())),
    microchip: v.optional(
      v.object({
        chipId: v.union(v.string(), v.null()),
        registry: v.union(v.string(), v.null()),
      })
    ),
    license: v.optional(
      v.object({
        licenseNumber: v.union(v.string(), v.null()),
        issuingCity: v.union(v.string(), v.null()),
        expiresAt: v.union(v.number(), v.null()),
      })
    ),
    temperamentTags: v.optional(v.array(v.string())),
    handlingNotes: v.optional(v.union(v.string(), v.null())),
    goodWith: v.optional(
      v.object({
        dogs: v.union(v.boolean(), v.null()),
        cats: v.union(v.boolean(), v.null()),
        kids: v.union(v.boolean(), v.null()),
      })
    ),
    medicalSummary: v.optional(v.union(v.string(), v.null())),
    allergies: v.optional(v.union(v.array(v.string()), v.null())),
    medications: v.optional(v.union(v.array(v.string()), v.null())),
    specialNeeds: v.optional(v.union(v.string(), v.null())),
    contacts: v.optional(
      v.array(
        v.object({
          name: v.string(),
          relationship: v.union(
            v.literal("owner"),
            v.literal("family"),
            v.literal("friend"),
            v.literal("vet"),
            v.literal("other")
          ),
          phone: v.union(v.string(), v.null()),
          email: v.union(v.string(), v.null()),
          preferred: v.boolean(),
        })
      )
    ),
    shareSettings: v.optional(
      v.object({
        allowPublicProfile: v.boolean(),
        showPhoneOnLostPost: v.boolean(),
        showEmailOnLostPost: v.boolean(),
        showExactLocation: v.boolean(),
      })
    ),
    primaryPhotoFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Require authentication, get user ID
    const userId = await requireCurrentUser(ctx);

    // Use provided ownerUserId or default to current user
    const ownerUserId = args.ownerUserId ?? userId;

    // Validate required fields
    if (!args.name || args.name.trim().length === 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Pet name is required",
      });
    }

    if (args.name.length > 100) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Pet name must be 100 characters or less",
      });
    }

    // Generate unique slug
    const baseSlug = generateSlug(args.name.trim());
    const slug = await ensureUniqueSlug(ctx, baseSlug);

    // Set defaults
    const now = Date.now();
    const petData = {
      ownerUserId,
      name: args.name.trim(),
      species: args.species,
      status: "active" as const,
      slug,
      createdAt: now,
      updatedAt: now,
      // Optional fields with defaults
      sex: args.sex ?? null,
      isSpayedNeutered: args.isSpayedNeutered ?? null,
      birthDate: args.birthDate ?? null,
      approxAgeYears: args.approxAgeYears ?? null,
      breedPrimary: args.breedPrimary ?? null,
      breedSecondary: args.breedSecondary ?? null,
      size: args.size ?? null,
      weightLbs: args.weightLbs ?? null,
      colorPrimary: args.colorPrimary ?? null,
      colorSecondary: args.colorSecondary ?? null,
      distinctiveMarks: args.distinctiveMarks ?? null,
      microchip: args.microchip ?? { chipId: null, registry: null },
      license: args.license ?? {
        licenseNumber: null,
        issuingCity: null,
        expiresAt: null,
      },
      temperamentTags: args.temperamentTags ?? [],
      handlingNotes: args.handlingNotes ?? null,
      goodWith: args.goodWith ?? {
        dogs: null,
        cats: null,
        kids: null,
      },
      medicalSummary: args.medicalSummary ?? null,
      allergies: args.allergies ?? null,
      medications: args.medications ?? null,
      specialNeeds: args.specialNeeds ?? null,
      contacts: args.contacts ?? [],
      shareSettings: args.shareSettings ?? {
        allowPublicProfile: false,
        showPhoneOnLostPost: true,
        showEmailOnLostPost: false,
        showExactLocation: false,
      },
      primaryPhotoFileId: args.primaryPhotoFileId,
    };

    // Insert pet document
    const petId = await ctx.db.insert("pets", petData);

    // Create initial petMembers entry for primary owner (role: "owner")
    await ctx.db.insert("petMembers", {
      petId,
      userId: ownerUserId,
      role: "owner",
      createdAt: now,
    });

    // Return created pet document
    return await ctx.db.get(petId);
  },
});

/**
 * Internal mutation to create pet without authentication
 * Used for seeding test data
 */
export const createPetInternal = internalMutation({
  args: {
    name: v.string(),
    species: v.union(v.literal("dog"), v.literal("cat"), v.literal("other")),
    ownerUserId: v.string(), // Required for internal mutation
    // Optional fields (same as createPet)
    sex: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("unknown"), v.null())
    ),
    isSpayedNeutered: v.optional(v.union(v.boolean(), v.null())),
    birthDate: v.optional(v.union(v.number(), v.null())),
    approxAgeYears: v.optional(v.union(v.number(), v.null())),
    breedPrimary: v.optional(v.union(v.string(), v.null())),
    breedSecondary: v.optional(v.union(v.string(), v.null())),
    size: v.optional(
      v.union(
        v.literal("xs"),
        v.literal("s"),
        v.literal("m"),
        v.literal("l"),
        v.literal("xl"),
        v.null()
      )
    ),
    weightLbs: v.optional(v.union(v.number(), v.null())),
    colorPrimary: v.optional(v.union(v.string(), v.null())),
    colorSecondary: v.optional(v.union(v.string(), v.null())),
    distinctiveMarks: v.optional(v.union(v.string(), v.null())),
    microchip: v.optional(
      v.object({
        chipId: v.union(v.string(), v.null()),
        registry: v.union(v.string(), v.null()),
      })
    ),
    license: v.optional(
      v.object({
        licenseNumber: v.union(v.string(), v.null()),
        issuingCity: v.union(v.string(), v.null()),
        expiresAt: v.union(v.number(), v.null()),
      })
    ),
    temperamentTags: v.optional(v.array(v.string())),
    handlingNotes: v.optional(v.union(v.string(), v.null())),
    goodWith: v.optional(
      v.object({
        dogs: v.union(v.boolean(), v.null()),
        cats: v.union(v.boolean(), v.null()),
        kids: v.union(v.boolean(), v.null()),
      })
    ),
    medicalSummary: v.optional(v.union(v.string(), v.null())),
    allergies: v.optional(v.union(v.array(v.string()), v.null())),
    medications: v.optional(v.union(v.array(v.string()), v.null())),
    specialNeeds: v.optional(v.union(v.string(), v.null())),
    contacts: v.optional(
      v.array(
        v.object({
          name: v.string(),
          relationship: v.union(
            v.literal("owner"),
            v.literal("family"),
            v.literal("friend"),
            v.literal("vet"),
            v.literal("other")
          ),
          phone: v.union(v.string(), v.null()),
          email: v.union(v.string(), v.null()),
          preferred: v.boolean(),
        })
      )
    ),
    shareSettings: v.optional(
      v.object({
        allowPublicProfile: v.boolean(),
        showPhoneOnLostPost: v.boolean(),
        showEmailOnLostPost: v.boolean(),
        showExactLocation: v.boolean(),
      })
    ),
    primaryPhotoFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Validate required fields
    if (!args.name || args.name.trim().length === 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Pet name is required",
      });
    }

    if (args.name.length > 100) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Pet name must be 100 characters or less",
      });
    }

    // Generate unique slug
    const baseSlug = generateSlug(args.name.trim());
    const slug = await ensureUniqueSlug(ctx, baseSlug);

    // Set defaults
    const now = Date.now();
    const petData = {
      ownerUserId: args.ownerUserId,
      name: args.name.trim(),
      species: args.species,
      status: "active" as const,
      slug,
      createdAt: now,
      updatedAt: now,
      // Optional fields with defaults
      sex: args.sex ?? null,
      isSpayedNeutered: args.isSpayedNeutered ?? null,
      birthDate: args.birthDate ?? null,
      approxAgeYears: args.approxAgeYears ?? null,
      breedPrimary: args.breedPrimary ?? null,
      breedSecondary: args.breedSecondary ?? null,
      size: args.size ?? null,
      weightLbs: args.weightLbs ?? null,
      colorPrimary: args.colorPrimary ?? null,
      colorSecondary: args.colorSecondary ?? null,
      distinctiveMarks: args.distinctiveMarks ?? null,
      microchip: args.microchip ?? { chipId: null, registry: null },
      license: args.license ?? {
        licenseNumber: null,
        issuingCity: null,
        expiresAt: null,
      },
      temperamentTags: args.temperamentTags ?? [],
      handlingNotes: args.handlingNotes ?? null,
      goodWith: args.goodWith ?? {
        dogs: null,
        cats: null,
        kids: null,
      },
      medicalSummary: args.medicalSummary ?? null,
      allergies: args.allergies ?? null,
      medications: args.medications ?? null,
      specialNeeds: args.specialNeeds ?? null,
      contacts: args.contacts ?? [],
      shareSettings: args.shareSettings ?? {
        allowPublicProfile: false,
        showPhoneOnLostPost: true,
        showEmailOnLostPost: false,
        showExactLocation: false,
      },
      primaryPhotoFileId: args.primaryPhotoFileId,
    };

    // Insert pet document
    const petId = await ctx.db.insert("pets", petData);

    // Create initial petMembers entry for primary owner (role: "owner")
    await ctx.db.insert("petMembers", {
      petId,
      userId: args.ownerUserId,
      role: "owner",
      createdAt: now,
    });

    // Return created pet document
    return await ctx.db.get(petId);
  },
});

/**
 * Update pet profile
 */
export const updatePet = mutation({
  args: {
    petId: v.id("pets"),
    updates: v.object({
      name: v.optional(v.string()),
      species: v.optional(
        v.union(v.literal("dog"), v.literal("cat"), v.literal("other"))
      ),
      status: v.optional(
        v.union(v.literal("active"), v.literal("deceased"), v.literal("archived"))
      ),
      sex: v.optional(
        v.union(v.literal("male"), v.literal("female"), v.literal("unknown"), v.null())
      ),
      isSpayedNeutered: v.optional(v.union(v.boolean(), v.null())),
      birthDate: v.optional(v.union(v.number(), v.null())),
      approxAgeYears: v.optional(v.union(v.number(), v.null())),
      breedPrimary: v.optional(v.union(v.string(), v.null())),
      breedSecondary: v.optional(v.union(v.string(), v.null())),
      size: v.optional(
        v.union(
          v.literal("xs"),
          v.literal("s"),
          v.literal("m"),
          v.literal("l"),
          v.literal("xl"),
          v.null()
        )
      ),
      weightLbs: v.optional(v.union(v.number(), v.null())),
      colorPrimary: v.optional(v.union(v.string(), v.null())),
      colorSecondary: v.optional(v.union(v.string(), v.null())),
      distinctiveMarks: v.optional(v.union(v.string(), v.null())),
      microchip: v.optional(
        v.object({
          chipId: v.union(v.string(), v.null()),
          registry: v.union(v.string(), v.null()),
        })
      ),
      license: v.optional(
        v.object({
          licenseNumber: v.union(v.string(), v.null()),
          issuingCity: v.union(v.string(), v.null()),
          expiresAt: v.union(v.number(), v.null()),
        })
      ),
      temperamentTags: v.optional(v.array(v.string())),
      handlingNotes: v.optional(v.union(v.string(), v.null())),
      goodWith: v.optional(
        v.object({
          dogs: v.union(v.boolean(), v.null()),
          cats: v.union(v.boolean(), v.null()),
          kids: v.union(v.boolean(), v.null()),
        })
      ),
      medicalSummary: v.optional(v.union(v.string(), v.null())),
      allergies: v.optional(v.union(v.array(v.string()), v.null())),
      medications: v.optional(v.union(v.array(v.string()), v.null())),
      specialNeeds: v.optional(v.union(v.string(), v.null())),
      contacts: v.optional(
        v.array(
          v.object({
            name: v.string(),
            relationship: v.union(
              v.literal("owner"),
              v.literal("family"),
              v.literal("friend"),
              v.literal("vet"),
              v.literal("other")
            ),
            phone: v.union(v.string(), v.null()),
            email: v.union(v.string(), v.null()),
            preferred: v.boolean(),
          })
        )
      ),
      shareSettings: v.optional(
        v.object({
          allowPublicProfile: v.boolean(),
          showPhoneOnLostPost: v.boolean(),
          showEmailOnLostPost: v.boolean(),
          showExactLocation: v.boolean(),
        })
      ),
      primaryPhotoFileId: v.optional(v.id("_storage")),
    }),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to edit this pet",
      });
    }

    // Load existing pet document
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    // Validate updates
    if (args.updates.name !== undefined) {
      const trimmedName = args.updates.name.trim();
      if (trimmedName.length === 0) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Pet name cannot be empty",
        });
      }
      if (trimmedName.length > 100) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Pet name must be 100 characters or less",
        });
      }
      args.updates.name = trimmedName;
    }

    // If slug is being updated (via name change), ensure uniqueness
    // Note: We don't expose slug in updates, but if name changes significantly,
    // we might want to regenerate slug. For now, slug stays stable.

    // Set updatedAt
    const updates = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    // Update document
    await ctx.db.patch(args.petId, updates);

    // Return updated pet document
    return await ctx.db.get(args.petId);
  },
});

/**
 * Soft delete (archive) pet
 * Only primary owner can delete
 */
export const deletePet = mutation({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Load pet to verify primary ownership
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    // Verify user is primary owner (only primary owner can delete)
    if (pet.ownerUserId !== userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Only the primary owner can delete a pet",
      });
    }

    // Update pet status to "archived" (soft delete)
    await ctx.db.patch(args.petId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Internal mutation to delete pet without authentication
 * Used for cleanup operations
 */
export const deletePetInternal = internalMutation({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    // Load pet
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    // Update pet status to "archived" (soft delete)
    await ctx.db.patch(args.petId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Internal query to get pets by owner ID (no auth required)
 * Used for cleanup operations
 */
export const getPetsByOwnerIdInternal = internalQuery({
  args: { ownerUserId: v.string() },
  handler: async (ctx, args) => {
    // Get pets where user is primary owner
    const ownedPets = await ctx.db
      .query("pets")
      .withIndex("by_ownerUserId", (q) =>
        q.eq("ownerUserId", args.ownerUserId)
      )
      .collect();

    // Get pets where user is a member
    const memberships = await ctx.db
      .query("petMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.ownerUserId))
      .collect();

    // Get pet documents for memberships
    const memberPetIds = memberships.map((m) => m.petId);
    const memberPets = await Promise.all(
      memberPetIds.map((id) => ctx.db.get(id))
    );

    // Merge and deduplicate (filter out nulls and archived pets)
    const allPets = [
      ...ownedPets,
      ...memberPets.filter((p): p is NonNullable<typeof p> => p !== null),
    ];

    // Deduplicate by _id
    const uniquePets = Array.from(
      new Map(allPets.map((pet) => [pet._id, pet])).values()
    );

    // Filter out archived pets
    return uniquePets.filter((pet) => pet.status !== "archived");
  },
});

/**
 * Add co-owner/guardian/viewer
 */
export const addPetMember = mutation({
  args: {
    petId: v.id("pets"),
    userId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("guardian"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const currentUserId = await requireCurrentUser(ctx);

    // Verify current user can edit pet
    const canEdit = await canEditPet(ctx, args.petId, currentUserId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to manage members for this pet",
      });
    }

    // Check if membership already exists
    const existing = await ctx.db
      .query("petMembers")
      .withIndex("by_petId_and_userId", (q) =>
        q.eq("petId", args.petId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "User is already a member of this pet",
      });
    }

    // Check if user is primary owner (they don't need a membership entry)
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    if (pet.ownerUserId === args.userId) {
      throw new ConvexError({
        code: "INVALID_OPERATION",
        message: "Primary owner is already a member",
      });
    }

    // Insert petMembers document
    const membershipId = await ctx.db.insert("petMembers", {
      petId: args.petId,
      userId: args.userId,
      role: args.role,
      createdAt: Date.now(),
    });

    return await ctx.db.get(membershipId);
  },
});

/**
 * Remove member
 * Cannot remove primary owner
 */
export const removePetMember = mutation({
  args: {
    petId: v.id("pets"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const currentUserId = await requireCurrentUser(ctx);

    // Verify current user can edit pet
    const canEdit = await canEditPet(ctx, args.petId, currentUserId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to manage members for this pet",
      });
    }

    // Prevent removing primary owner
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    if (pet.ownerUserId === args.userId) {
      throw new ConvexError({
        code: "INVALID_OPERATION",
        message: "Cannot remove primary owner. Transfer ownership first.",
      });
    }

    // Find and delete membership
    const membership = await ctx.db
      .query("petMembers")
      .withIndex("by_petId_and_userId", (q) =>
        q.eq("petId", args.petId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Membership not found",
      });
    }

    await ctx.db.delete(membership._id);

    return { success: true };
  },
});

/**
 * Update member role
 */
export const updatePetMemberRole = mutation({
  args: {
    petId: v.id("pets"),
    userId: v.string(),
    newRole: v.union(
      v.literal("owner"),
      v.literal("guardian"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const currentUserId = await requireCurrentUser(ctx);

    // Verify current user can edit pet
    const canEdit = await canEditPet(ctx, args.petId, currentUserId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to manage members for this pet",
      });
    }

    // Find membership
    const membership = await ctx.db
      .query("petMembers")
      .withIndex("by_petId_and_userId", (q) =>
        q.eq("petId", args.petId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Membership not found",
      });
    }

    // Update role
    await ctx.db.patch(membership._id, {
      role: args.newRole,
    });

    return await ctx.db.get(membership._id);
  },
});

/**
 * Set primary photo
 */
export const setPrimaryPhoto = mutation({
  args: {
    petId: v.id("pets"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to edit this pet",
      });
    }

    // Verify file exists
    const fileMetadata = await ctx.db.system.get(args.fileId);
    if (!fileMetadata) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    // Verify file is associated with pet
    const petFile = await ctx.db
      .query("petFiles")
      .withIndex("by_petId", (q) => q.eq("petId", args.petId))
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (!petFile) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "File is not associated with this pet",
      });
    }

    // Update primaryPhotoFileId
    await ctx.db.patch(args.petId, {
      primaryPhotoFileId: args.fileId,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.petId);
  },
});

/**
 * Add emergency contact
 */
export const addPetContact = mutation({
  args: {
    petId: v.id("pets"),
    contact: v.object({
      name: v.string(),
      relationship: v.union(
        v.literal("owner"),
        v.literal("family"),
        v.literal("friend"),
        v.literal("vet"),
        v.literal("other")
      ),
      phone: v.union(v.string(), v.null()),
      email: v.union(v.string(), v.null()),
      preferred: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to edit this pet",
      });
    }

    // Load pet
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    // Limit max contacts (e.g., 5)
    if (pet.contacts.length >= 5) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Maximum of 5 contacts allowed",
      });
    }

    // Add contact
    const updatedContacts = [...pet.contacts, args.contact];

    await ctx.db.patch(args.petId, {
      contacts: updatedContacts,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.petId);
  },
});

/**
 * Update existing contact
 */
export const updatePetContact = mutation({
  args: {
    petId: v.id("pets"),
    contactIndex: v.number(),
    updates: v.object({
      name: v.optional(v.string()),
      relationship: v.optional(
        v.union(
          v.literal("owner"),
          v.literal("family"),
          v.literal("friend"),
          v.literal("vet"),
          v.literal("other")
        )
      ),
      phone: v.optional(v.union(v.string(), v.null())),
      email: v.optional(v.union(v.string(), v.null())),
      preferred: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to edit this pet",
      });
    }

    // Load pet
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    // Validate index
    if (
      args.contactIndex < 0 ||
      args.contactIndex >= pet.contacts.length
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Invalid contact index",
      });
    }

    // Update contact
    const updatedContacts = [...pet.contacts];
    updatedContacts[args.contactIndex] = {
      ...updatedContacts[args.contactIndex],
      ...args.updates,
    };

    await ctx.db.patch(args.petId, {
      contacts: updatedContacts,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.petId);
  },
});

/**
 * Remove contact
 */
export const removePetContact = mutation({
  args: {
    petId: v.id("pets"),
    contactIndex: v.number(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to edit this pet",
      });
    }

    // Load pet
    const pet = await ctx.db.get(args.petId);
    if (!pet) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pet not found",
      });
    }

    // Validate index
    if (
      args.contactIndex < 0 ||
      args.contactIndex >= pet.contacts.length
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Invalid contact index",
      });
    }

    // Remove contact
    const updatedContacts = pet.contacts.filter(
      (_, index) => index !== args.contactIndex
    );

    await ctx.db.patch(args.petId, {
      contacts: updatedContacts,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.petId);
  },
});
