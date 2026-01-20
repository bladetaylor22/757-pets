"use client";

import { useSession } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Custom hook that combines Better Auth session with Convex user data
 */
export function useAuth() {
    const { data: session, isPending: sessionPending } = useSession();
    const user = useQuery(
        api.auth.getCurrentUser,
        session ? {} : "skip"
    );

    return {
        session,
        user,
        isAuthenticated: !!session && !!user,
        isLoading: sessionPending || (session && user === undefined),
    };
}
