"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { LoginSimpleMinimal } from "@/components/shared-assets/login/login-simple-minimal";
import { handleAuthError } from "@/lib/auth-errors";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Redirect authenticated users to homepage
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, authLoading, router]);

    const handleSignIn = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(handleAuthError(result.error));
                return;
            }

            // Redirect after successful sign-in
            router.push("/");
        } catch (err) {
            setError(handleAuthError(err));
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-tertiary">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render login form if user is authenticated (will redirect)
    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <LoginSimpleMinimal
                onSignIn={handleSignIn}
                error={error}
                isLoading={isLoading}
            />
        </div>
    );
}
