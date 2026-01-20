import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireCurrentUser, canEditPet, canViewPet } from "./utils";

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Link uploaded file to pet
 * Files are uploaded via Convex file storage workflow:
 * 1. Client calls generateUploadUrl mutation
 * 2. Client uploads file to returned URL, receives storageId
 * 3. Client calls addPetFile with storageId to link file to pet
 */
export const addPetFile = mutation({
  args: {
    petId: v.id("pets"),
    storageId: v.id("_storage"),
    kind: v.union(v.literal("photo"), v.literal("document")),
    docType: v.optional(
      v.union(
        v.literal("rabies"),
        v.literal("vaccination"),
        v.literal("adoption"),
        v.literal("insurance"),
        v.literal("other"),
        v.null()
      )
    ),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to add files to this pet",
      });
    }

    // Verify file exists in _storage system table
    const fileMetadata = await ctx.db.system.get(args.storageId);
    if (!fileMetadata) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "File not found in storage",
      });
    }

    // Validate docType matches kind
    if (args.kind === "document" && !args.docType) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "docType is required for document files",
      });
    }

    if (args.kind === "photo" && args.docType !== undefined) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "docType should not be set for photo files",
      });
    }

    // Set default visibility: "public" for photos, "private" for documents
    const visibility =
      args.visibility ??
      (args.kind === "photo" ? "public" : "private");

    // Insert petFiles document
    const fileId = await ctx.db.insert("petFiles", {
      petId: args.petId,
      fileId: args.storageId,
      kind: args.kind,
      docType: args.kind === "document" ? args.docType ?? null : null,
      visibility,
      label: args.label ?? null,
      createdAt: Date.now(),
    });

    // If this is first photo and pet has no primaryPhotoFileId, set it automatically
    if (args.kind === "photo") {
      const pet = await ctx.db.get(args.petId);
      if (pet && !pet.primaryPhotoFileId) {
      await ctx.db.patch(args.petId, {
        primaryPhotoFileId: args.storageId,
        updatedAt: Date.now(),
      });
      }
    }

    return await ctx.db.get(fileId);
  },
});

/**
 * Internal mutation to add pet file without authentication
 * Used for seeding test data
 */
export const addPetFileInternal = internalMutation({
  args: {
    petId: v.id("pets"),
    storageId: v.id("_storage"),
    kind: v.union(v.literal("photo"), v.literal("document")),
    docType: v.optional(
      v.union(
        v.literal("rabies"),
        v.literal("vaccination"),
        v.literal("adoption"),
        v.literal("insurance"),
        v.literal("other"),
        v.null()
      )
    ),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify file exists in _storage system table
    const fileMetadata = await ctx.db.system.get(args.storageId);
    if (!fileMetadata) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "File not found in storage",
      });
    }

    // Validate docType matches kind
    if (args.kind === "document" && !args.docType) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "docType is required for document files",
      });
    }

    if (args.kind === "photo" && args.docType !== undefined) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "docType should not be set for photo files",
      });
    }

    // Set default visibility: "public" for photos, "private" for documents
    const visibility =
      args.visibility ??
      (args.kind === "photo" ? "public" : "private");

    // Insert petFiles document
    const fileId = await ctx.db.insert("petFiles", {
      petId: args.petId,
      fileId: args.storageId,
      kind: args.kind,
      docType: args.kind === "document" ? args.docType ?? null : null,
      visibility,
      label: args.label ?? null,
      createdAt: Date.now(),
    });

    // If this is first photo and pet has no primaryPhotoFileId, set it automatically
    if (args.kind === "photo") {
      const pet = await ctx.db.get(args.petId);
      if (pet && !pet.primaryPhotoFileId) {
        await ctx.db.patch(args.petId, {
          primaryPhotoFileId: args.storageId,
          updatedAt: Date.now(),
        });
      }
    }

    return await ctx.db.get(fileId);
  },
});

/**
 * Remove file association
 * Optionally delete file from storage
 */
export const removePetFile = mutation({
  args: {
    petId: v.id("pets"),
    fileId: v.id("petFiles"),
    deleteStorage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, args.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to remove files from this pet",
      });
    }

    // Load petFiles document
    const petFile = await ctx.db.get(args.fileId);
    if (!petFile) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "File association not found",
      });
    }

    // Verify file belongs to the pet
    if (petFile.petId !== args.petId) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "File does not belong to this pet",
      });
    }

    // If deleteStorage is true, delete file from storage
    if (args.deleteStorage === true) {
      try {
        await ctx.storage.delete(petFile.fileId);
      } catch (error) {
        // Log error but continue with removing the association
        console.error("Failed to delete file from storage:", error);
      }
    }

    // Check if removed file was primary photo
    const pet = await ctx.db.get(args.petId);
    if (pet && pet.primaryPhotoFileId === petFile.fileId) {
      // Find next available photo to set as primary
      const photos = await ctx.db
        .query("petFiles")
        .withIndex("by_petId_and_kind", (q) =>
          q.eq("petId", args.petId).eq("kind", "photo")
        )
        .filter((q) => q.neq(q.field("_id"), args.fileId))
        .first();

      await ctx.db.patch(args.petId, {
        primaryPhotoFileId: photos?.fileId ?? undefined,
        updatedAt: Date.now(),
      });
    }

    // Delete petFiles document
    await ctx.db.delete(args.fileId);

    return { success: true };
  },
});

/**
 * Change file visibility
 */
export const updateFileVisibility = mutation({
  args: {
    fileId: v.id("petFiles"),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Load petFiles document
    const petFile = await ctx.db.get(args.fileId);
    if (!petFile) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "File association not found",
      });
    }

    // Verify can edit pet
    const canEdit = await canEditPet(ctx, petFile.petId, userId);
    if (!canEdit) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to update this file",
      });
    }

    // Update visibility
    await ctx.db.patch(args.fileId, {
      visibility: args.visibility,
    });

    return await ctx.db.get(args.fileId);
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get files filtered by kind (photo/document)
 */
export const getPetFilesByKind = query({
  args: {
    petId: v.id("pets"),
    kind: v.union(v.literal("photo"), v.literal("document")),
    includePrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireCurrentUser(ctx);

    // Verify can view pet
    const canView = await canViewPet(ctx, args.petId, userId, false);
    if (!canView) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to view this pet's files",
      });
    }

    // Query files by petId and kind
    const files = await ctx.db
      .query("petFiles")
      .withIndex("by_petId_and_kind", (q) =>
        q.eq("petId", args.petId).eq("kind", args.kind)
      )
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

/**
 * Get all documents for a pet
 */
export const getPetDocuments = query({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    // Call getPetFilesByKind with kind: "document" and includePrivate: true
    // (owner can see all documents)
    const userId = await requireCurrentUser(ctx);

    // Verify can view pet
    const canView = await canViewPet(ctx, args.petId, userId, false);
    if (!canView) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to view this pet's documents",
      });
    }

    // Get all documents (include private)
    const documents = await ctx.db
      .query("petFiles")
      .withIndex("by_petId_and_kind", (q) =>
        q.eq("petId", args.petId).eq("kind", "document")
      )
      .collect();

    // Get URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.fileId);
        return {
          ...doc,
          url,
        };
      })
    );

    return documentsWithUrls;
  },
});
