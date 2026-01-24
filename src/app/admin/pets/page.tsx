"use client";

import { TopNavbar } from "@/components/marketing/header-navigation/top-navbar";
import { ProtectedAdminRoute } from "@/components/auth/protected-admin-route";

function AdminPetsContent() {
    return (
        <div className="bg-primary">
            <TopNavbar
                items={[
                    { label: "Home", href: "/" },
                    { label: "Dashboard", href: "/admin" },
                    { label: "Pets", href: "/admin/pets" },
                ]}
            />

            <main className="bg-primary pt-8 pb-16 lg:pt-12 lg:pb-24">
                <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-4 lg:px-8">
                    <div className="flex flex-col gap-0.5 lg:gap-1">
                        <p className="text-xl font-semibold text-primary lg:text-display-xs">
                            Pets Management
                        </p>
                        <p className="text-md text-tertiary">
                            Manage and view all pets in the platform.
                        </p>
                    </div>

                    {/* Blank content area - will be populated later */}
                    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-secondary bg-primary">
                        <p className="text-tertiary">Content coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AdminPetsPage() {
    return (
        <ProtectedAdminRoute>
            <AdminPetsContent />
        </ProtectedAdminRoute>
    );
}
