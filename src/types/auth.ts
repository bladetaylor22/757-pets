import type { Session } from "better-auth/types";

export type AuthUser = Session["user"];

export interface AuthSession extends Session {
    user: AuthUser;
}

export type AuthStatus = "authenticated" | "unauthenticated" | "loading";
