import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

if (!process.env.NEXT_PUBLIC_CONVEX_SITE_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL is not set");
}

export const {
    handler,
    preloadAuthQuery,
    isAuthenticated,
    getToken,
    fetchAuthQuery,
    fetchAuthMutation,
    fetchAuthAction,
} = convexBetterAuthNextJs({
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
    convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
