"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { signOut } from "@/lib/auth-client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/base/buttons/button";
import Link from "next/link";
import { useState } from "react";
import { TopNavbar } from "@/components/marketing/header-navigation/top-navbar";

function PetProfilesSection() {
    const { isAuthenticated } = useAuth();
    const pets = useQuery(api.pets.getPetsByOwner, isAuthenticated ? {} : "skip");

    if (pets === undefined) {
        return (
            <div className="rounded-lg bg-primary p-4">
                <h2 className="mb-2 font-semibold">Pet Profiles</h2>
                <div className="text-sm text-muted-foreground">Loading pets...</div>
            </div>
        );
    }

    if (pets.length === 0) {
        return (
            <div className="rounded-lg bg-primary p-4">
                <h2 className="mb-2 font-semibold">Pet Profiles</h2>
                <div className="text-sm text-muted-foreground">
                    No pets found.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-primary p-4">
            <h2 className="mb-2 font-semibold">Pet Profiles ({pets.length})</h2>
            <div className="space-y-3">
                {pets.map((pet) => (
                    <div
                        key={pet._id}
                        className="rounded border border-secondary bg-secondary p-3"
                    >
                        <div className="flex items-start gap-3">
                            {pet.primaryPhotoFileId && (
                                <PetPhoto fileId={pet.primaryPhotoFileId} />
                            )}
                            <div className="flex-1 space-y-1 text-sm">
                                <div className="font-semibold">{pet.name}</div>
                                <div className="space-y-0.5 text-xs text-muted-foreground">
                                    <div>
                                        <strong>Species:</strong> {pet.species}
                                    </div>
                                    {pet.breedPrimary && (
                                        <div>
                                            <strong>Breed:</strong> {pet.breedPrimary}
                                            {pet.breedSecondary && ` / ${pet.breedSecondary}`}
                                        </div>
                                    )}
                                    {pet.size && (
                                        <div>
                                            <strong>Size:</strong> {pet.size.toUpperCase()}
                                        </div>
                                    )}
                                    {pet.colorPrimary && (
                                        <div>
                                            <strong>Color:</strong> {pet.colorPrimary}
                                            {pet.colorSecondary && ` / ${pet.colorSecondary}`}
                                        </div>
                                    )}
                                    {pet.approxAgeYears && (
                                        <div>
                                            <strong>Age:</strong> ~{pet.approxAgeYears} years
                                        </div>
                                    )}
                                    <div>
                                        <strong>Status:</strong> {pet.status}
                                    </div>
                                    <div>
                                        <strong>Slug:</strong> {pet.slug}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PetPhoto({ fileId }: { fileId: Id<"_storage"> }) {
    const fileUrl = useQuery(
        api.files.getFileUrl,
        { storageId: fileId }
    );

    if (!fileUrl) {
        return (
            <div className="h-16 w-16 shrink-0 rounded border border-secondary bg-muted" />
        );
    }

    return (
        <img
            src={fileUrl}
            alt="Pet photo"
            className="h-16 w-16 shrink-0 rounded border border-secondary object-cover"
        />
    );
}

export default function TestAuthPage() {
    const { session, user: convexUser, isAuthenticated, isLoading } = useAuth();
    const { isPlatformOwner } = useAdmin();
    const sendTestEmail = useMutation(api.emails.sendTestEmail);
    const [emailStatus, setEmailStatus] = useState<{
        loading: boolean;
        success: boolean;
        error: string | null;
    }>({ loading: false, success: false, error: null });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <TopNavbar />
            <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
                <div className="w-full max-w-2xl space-y-6 rounded-lg border border-secondary bg-secondary p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Better Auth Test Page</h1>
                    {isAuthenticated && isPlatformOwner && (
                        <Link href="/admin">
                            <Button color="primary" size="md">
                                Admin area
                            </Button>
                        </Link>
                    )}
                </div>

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

                    {session?.user && (
                        <div className="rounded-lg bg-primary p-4">
                            <h2 className="mb-2 font-semibold">Better Auth Session User</h2>
                            <pre className="overflow-auto text-xs">
                                {JSON.stringify(session.user, null, 2)}
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

                    {isAuthenticated && convexUser && (
                        <PetProfilesSection />
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
                        <div className="space-y-4">
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

                            <div className="rounded-lg border border-primary p-4">
                                <h3 className="mb-2 font-semibold">Email Testing</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Send a test email to your account email address:{" "}
                                    <strong>{convexUser?.email}</strong>
                                </p>
                                <Button
                                    onClick={async () => {
                                        setEmailStatus({ loading: true, success: false, error: null });
                                        try {
                                            const result = await sendTestEmail();
                                            setEmailStatus({
                                                loading: false,
                                                success: true,
                                                error: null,
                                            });
                                            console.log("Email result:", result);
                                            setTimeout(() => {
                                                setEmailStatus({
                                                    loading: false,
                                                    success: false,
                                                    error: null,
                                                });
                                            }, 5000);
                                        } catch (error) {
                                            setEmailStatus({
                                                loading: false,
                                                success: false,
                                                error:
                                                    error instanceof Error
                                                        ? error.message
                                                        : "Failed to send email",
                                            });
                                        }
                                    }}
                                    disabled={emailStatus.loading}
                                    color="primary"
                                >
                                    {emailStatus.loading
                                        ? "Sending..."
                                        : "Send Test Email"}
                                </Button>
                                {emailStatus.success && (
                                    <div className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">
                                        ✅ Test email queued successfully! Check your inbox and Resend dashboard.
                                        <br />
                                        <span className="text-xs">
                                            If you don&apos;t receive it, check: 1) Resend dashboard for delivery status, 2) Spam folder, 3) Domain verification in Resend
                                        </span>
                                    </div>
                                )}
                                {emailStatus.error && (
                                    <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-800">
                                        ❌ Error: {emailStatus.error}
                                    </div>
                                )}
                            </div>
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
        </div>
    );
}
