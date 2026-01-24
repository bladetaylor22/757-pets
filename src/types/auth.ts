// Better Auth types
// These types represent the structure returned from Better Auth client methods
// The exact structure may vary, so these are flexible type definitions

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    phoneNumber?: string | null;
    createdAt?: Date | string | number;
    updatedAt?: Date | string | number;
}

// Session data structure from Better Auth
export type AuthSession = {
    user: AuthUser;
    session: {
        id: string;
        userId: string;
        expiresAt: Date | string | number;
        token: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    };
} | null;

export type AuthStatus = "authenticated" | "unauthenticated" | "loading";
