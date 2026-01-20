"use client";

import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/base/buttons/button";

export default function TestAuthPage() {
    const { session, user, isAuthenticated, isLoading } = useAuth();
    const convexUser = useQuery(
        api.auth.getCurrentUser,
        isAuthenticated ? {} : "skip"
    );

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
            <div className="w-full max-w-2xl space-y-6 rounded-lg border border-secondary bg-secondary p-8">
                <h1 className="text-2xl font-bold">Better Auth Test Page</h1>

                <div className="space-y-4">
                    <div className="rounded-lg bg-primary p-4">
                        <h2 className="mb-2 font-semibold">Auth Hook Status</h2>
                        <div className="space-y-1 text-sm">
                            <div>
                                <strong>Is Authenticated:</strong>{" "}
                                {isAuthenticated ? "✅ Yes" : "❌ No"}
                            </div>
                            <div>
                                <strong>Is Loading:</strong> {isLoading ? "Yes" : "No"}
                            </div>
                        </div>
                    </div>

                    {session && (
                        <div className="rounded-lg bg-primary p-4">
                            <h2 className="mb-2 font-semibold">Better Auth Session</h2>
                            <pre className="overflow-auto text-xs">
                                {JSON.stringify(session, null, 2)}
                            </pre>
                        </div>
                    )}

                    {user && (
                        <div className="rounded-lg bg-primary p-4">
                            <h2 className="mb-2 font-semibold">Better Auth User</h2>
                            <pre className="overflow-auto text-xs">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                    )}

                    {convexUser && (
                        <div className="rounded-lg bg-primary p-4">
                            <h2 className="mb-2 font-semibold">Convex User Query</h2>
                            <div className="space-y-1 text-sm">
                                <div>
                                    <strong>Name:</strong> {convexUser.name}
                                </div>
                                <div>
                                    <strong>Email:</strong> {convexUser.email}
                                </div>
                                <div>
                                    <strong>ID:</strong> {convexUser._id}
                                </div>
                            </div>
                            <pre className="mt-2 overflow-auto text-xs">
                                {JSON.stringify(convexUser, null, 2)}
                            </pre>
                        </div>
                    )}

                    {!isAuthenticated && (
                        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
                            <p className="font-semibold">Not authenticated</p>
                            <p className="mt-2 text-sm">
                                Go to <a href="/sign-up" className="underline">/sign-up</a> to create
                                an account
                            </p>
                        </div>
                    )}

                    {isAuthenticated && (
                        <div className="flex gap-4">
                            <Button
                                onClick={async () => {
                                    await signOut();
                                    window.location.href = "/";
                                }}
                            >
                                Sign Out
                            </Button>
                            <Button href="/sign-up" color="secondary">
                                Go to Sign Up
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mt-8 rounded-lg border-t border-secondary pt-4">
                    <h3 className="mb-2 font-semibold">Quick Tests</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            ✅ Check if session endpoint works:{" "}
                            <a
                                href="/api/auth/session"
                                target="_blank"
                                className="text-blue-600 underline"
                            >
                                /api/auth/session
                            </a>
                        </div>
                        <div>
                            ✅ Test sign-up flow:{" "}
                            <a href="/sign-up" className="text-blue-600 underline">
                                /sign-up
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
