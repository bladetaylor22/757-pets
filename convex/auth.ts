import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { betterAuth } from "better-auth";
import authConfig from "./auth.config";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

const siteUrl = process.env.SITE_URL!;

if (!siteUrl) {
    throw new Error("SITE_URL environment variable is not set");
}

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
    return betterAuth({
        baseURL: siteUrl,
        database: authComponent.adapter(ctx),
        // Configure email/password authentication
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false, // Set to true after email setup (Phase 2)
            sendResetPassword: async ({ user, url, token }, _request) => {
                // Send email without blocking (avoid timing attacks)
                // ctx is ActionCtx when called from HTTP actions, so runMutation is available
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (ctx as any)
                    .runMutation(internal.emails.sendResetPasswordInternal, {
                        to: user.email,
                        url,
                        token,
                        name: user.name ?? undefined,
                    })
                    .catch((error: unknown) => {
                        console.error("Failed to send password reset email:", error);
                    });
            },
        },
        // Configure email verification
        emailVerification: {
            sendOnSignUp: true, // Automatically send verification email on signup
            autoSignInAfterVerification: true, // Sign user in after verification
            sendVerificationEmail: async ({ user, url, token }, _request) => {
                // Send email without blocking (avoid timing attacks)
                // ctx is ActionCtx when called from HTTP actions, so runMutation is available
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (ctx as any)
                    .runMutation(internal.emails.sendVerificationEmailInternal, {
                        to: user.email,
                        url,
                        token,
                        name: user.name ?? undefined,
                    })
                    .catch((error: unknown) => {
                        console.error("Failed to send verification email:", error);
                    });
            },
        },
        plugins: [
            // The Convex plugin is required for Convex compatibility
            convex({ authConfig }),
        ],
    });
};

// Helper function for getting the current authenticated user
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return authComponent.getAuthUser(ctx);
    },
});

// Helper function requiring authentication
export const requireAuth = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new ConvexError({
                code: "UNAUTHENTICATED",
                message: "Authentication required",
            });
        }
        return user;
    },
});

// Example mutation for updating user profile
export const updateUserProfile = mutation({
    args: {
        name: v.optional(v.string()),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new ConvexError({
                code: "UNAUTHENTICATED",
                message: "Authentication required",
            });
        }

        const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
        
        // Update user via Better Auth API
        if (args.email) {
            await auth.api.changeEmail({
                body: { newEmail: args.email },
                headers,
            });
        }

        // Update name if provided
        if (args.name) {
            await auth.api.updateUser({
                body: { name: args.name },
                headers,
            });
        }

        return { success: true };
    },
});
