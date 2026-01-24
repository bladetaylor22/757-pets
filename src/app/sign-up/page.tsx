"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { SignupSplitImage } from "@/components/shared-assets/signup/signup-split-image";
import { handleAuthError } from "@/lib/auth-errors";
import { TopNavbar } from "@/components/marketing/header-navigation/top-navbar";
import { useAuth } from "@/hooks/use-auth";

export default function SignUpPage() {
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

    const handleSignUp = async (email: string, password: string, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await signUp.email({
                email,
                password,
                name,
            });

            if (result.error) {
                setError(handleAuthError(result.error));
                return;
            }

            // Redirect after successful sign-up
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
                <TopNavbar />
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-tertiary">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render sign-up form if user is authenticated (will redirect)
    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <TopNavbar />
            <SignupSplitImage
                onSignUp={handleSignUp}
                error={error}
                isLoading={isLoading}
            />
        </div>
    );
}
