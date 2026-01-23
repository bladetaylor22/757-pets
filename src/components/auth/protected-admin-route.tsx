"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedAdminRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
    fallback?: React.ReactNode;
}

export function ProtectedAdminRoute({
    children,
    redirectTo = "/",
    fallback,
}: ProtectedAdminRouteProps) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { isPlatformOwner, isLoading: adminLoading } = useAdmin();
    const router = useRouter();

    const isLoading = authLoading || adminLoading;

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !isPlatformOwner)) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, isPlatformOwner, isLoading, redirectTo, router]);

    if (isLoading) {
        return fallback ?? <div>Loading...</div>;
    }

    if (!isAuthenticated || !isPlatformOwner) {
        return null;
    }

    return <>{children}</>;
}
