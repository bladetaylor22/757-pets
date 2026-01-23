"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { SignupSplitImage } from "@/components/shared-assets/signup/signup-split-image";
import { handleAuthError } from "@/lib/auth-errors";
import { TopNavbar } from "@/components/marketing/header-navigation/top-navbar";

export default function SignUpPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
