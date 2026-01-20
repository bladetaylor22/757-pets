export class AuthError extends Error {
    constructor(
        message: string,
        public code?: string,
        public statusCode?: number
    ) {
        super(message);
        this.name = "AuthError";
    }
}

export function handleAuthError(error: unknown): string {
    if (error instanceof AuthError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "An unexpected error occurred";
}

export const AUTH_ERROR_MESSAGES = {
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_EXISTS: "An account with this email already exists",
    WEAK_PASSWORD: "Password must be at least 8 characters",
    UNAUTHENTICATED: "Please sign in to continue",
    SESSION_EXPIRED: "Your session has expired. Please sign in again",
} as const;
