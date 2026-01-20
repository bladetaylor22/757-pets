"use server";

import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

/**
 * Get the current authenticated user from server components/actions
 */
export async function getServerUser() {
    if (!(await isAuthenticated())) {
        return null;
    }

    try {
        return await fetchAuthQuery(api.auth.getCurrentUser);
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

/**
 * Require authentication, throw error if not authenticated
 */
export async function requireServerUser() {
    const user = await getServerUser();
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}
