"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { LoginSimpleMinimal } from "@/components/shared-assets/login/login-simple-minimal";
import { handleAuthError } from "@/lib/auth-errors";
import { TopNavbar } from "@/components/marketing/header-navigation/top-navbar";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className="flex min-h-screen flex-col">
            <TopNavbar />
            <LoginSimpleMinimal
                onSignIn={handleSignIn}
                error={error}
                isLoading={isLoading}
            />
        </div>
    );
}
