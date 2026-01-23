"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./use-auth";

/**
 * Custom hook to check if the current user is a platform owner
 */
export function useAdmin() {
    const { isAuthenticated, session } = useAuth();
    const isPlatformOwner = useQuery(
        api.admin.isCurrentUserPlatformOwner,
        isAuthenticated && session ? {} : "skip"
    );

    return {
        isPlatformOwner: isPlatformOwner ?? false,
        isLoading: isAuthenticated && isPlatformOwner === undefined,
    };
}
