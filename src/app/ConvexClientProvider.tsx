"use client";

import { type PropsWithChildren, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

// Type assertion: we've already checked convexUrl is defined above
const CONVEX_URL: string = convexUrl;

export function ConvexClientProvider({
    children,
    initialToken,
}: PropsWithChildren<{ initialToken?: string | null }>) {
    // Create Convex client instance
    const convex = useMemo(
        () => new ConvexReactClient(CONVEX_URL),
        []
    );

    return (
        <ConvexBetterAuthProvider
            client={convex}
            authClient={authClient}
            initialToken={initialToken}
        >
            {children}
        </ConvexBetterAuthProvider>
    );
}
