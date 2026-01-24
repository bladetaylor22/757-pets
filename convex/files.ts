import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate upload URL for client-side file uploads
 * This is the first step in the file upload workflow:
 * 1. Client calls this mutation to get upload URL
 * 2. Client uploads file to returned URL, receives storageId
 * 3. Client links file to pet via addPetFile mutation
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get file URL from storage ID
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get file URL from storage ID (mutation version for use in submit handlers)
 */
export const getFileUrlMutation = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
