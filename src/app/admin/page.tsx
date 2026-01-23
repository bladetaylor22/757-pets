"use client";

import { useMemo, useState } from "react";
import { FilterLines, Monitor04, SearchLg, UserPlus01, Users01, XClose } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProtectedAdminRoute } from "@/components/auth/protected-admin-route";
import { HeaderNavigationBase } from "@/components/application/app-navigation/header-navigation";
import { MetricsChart02 } from "@/components/application/metrics/metrics";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithButton, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

function AdminDashboardContent() {
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>();
    const [searchQuery, setSearchQuery] = useState("");

    const stats = useQuery(api.admin.getPlatformStats);
    const platformOwners = useQuery(api.admin.getPlatformOwners);
    const currentUser = useQuery(api.admin.getCurrentAdminUser);

    // Format numbers with commas
    const formatNumber = (num: number) => {
        return num.toLocaleString();
    };

    // Filter and sort platform owners
    const filteredAndSortedOwners = useMemo(() => {
        if (!platformOwners) return [];

        let filtered = platformOwners;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = platformOwners.filter(
                (owner) =>
                    owner.userId.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        if (!sortDescriptor) return filtered;

        return filtered.toSorted((a, b) => {
            const first: string | number = a[sortDescriptor.column as keyof typeof a] as string | number;
            const second: string | number = b[sortDescriptor.column as keyof typeof b] as string | number;

            // Handle createdAt (numbers)
            if (sortDescriptor.column === "createdAt") {
                return sortDescriptor.direction === "ascending"
                    ? (first as number) - (second as number)
                    : (second as number) - (first as number);
            }

            // Handle strings
            if (typeof first === "string" && typeof second === "string") {
                const result = first.localeCompare(second);
                return sortDescriptor.direction === "ascending" ? result : -result;
            }

            return 0;
        });
    }, [platformOwners, searchQuery, sortDescriptor]);

    const isLoading = stats === undefined || platformOwners === undefined || currentUser === undefined;

    if (isLoading) {
        return (
            <div className="bg-primary">
                <HeaderNavigationBase
                    items={[
                        { label: "Home", href: "/" },
                        {
                            label: "Admin Dashboard",
                            href: "/admin",
                            current: true,
                        },
                    ]}
                />
                <main className="bg-primary pt-8 pb-16 lg:pt-12 lg:pb-24">
                    <div className="flex items-center justify-center py-12">
                        <p className="text-tertiary">Loading statistics...</p>
                    </div>
                </main>
            </div>
        );
    }

    const userName = currentUser?.name || currentUser?.email || "Admin";

    return (
        <div className="bg-primary">
            <HeaderNavigationBase
                items={[
                    { label: "Home", href: "/" },
                    {
                        label: "Admin Dashboard",
                        href: "/admin",
                        current: true,
                    },
                ]}
            />

            <main className="bg-primary pt-8 pb-16 lg:pt-12 lg:pb-24">
                <div className="flex flex-col gap-8">
                    <div className="mx-auto flex w-full max-w-container flex-col justify-between gap-4 px-4 lg:flex-row lg:px-8">
                        <div className="flex flex-col gap-0.5 lg:gap-1">
                            <p className="text-xl font-semibold text-primary lg:text-display-xs">
                                Welcome back, {userName.split(" ")[0]}
                            </p>
                            <p className="text-md text-tertiary">
                                Monitor and manage platform statistics and administrators.
                            </p>
                        </div>
                    </div>

                    <div className="mx-auto flex w-full max-w-container flex-col gap-5 px-4 md:flex-row md:flex-wrap lg:gap-6 lg:px-8">
                        <MetricsChart02
                            icon={Monitor04}
                            title={formatNumber(stats.pets.total)}
                            subtitle="Total pets"
                            change="—"
                            changeTrend="positive"
                            className="flex-1 md:min-w-[320px]"
                        />
                        <MetricsChart02
                            icon={Users01}
                            title={formatNumber(stats.users.uniquePetOwners)}
                            subtitle="Pet owners"
                            change="—"
                            changeTrend="positive"
                            className="flex-1 md:min-w-[320px]"
                        />
                        <MetricsChart02
                            icon={UserPlus01}
                            title={formatNumber(stats.pets.active)}
                            subtitle="Active pets"
                            change="—"
                            changeTrend="positive"
                            className="flex-1 md:min-w-[320px]"
                        />
                    </div>

                    <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-4 lg:px-8">
                        <div className="hidden justify-between gap-4 lg:flex">
                            <div className="flex gap-3">
                                <Button iconTrailing={XClose} size="md" color="secondary">
                                    All time
                                </Button>
                                <Button iconLeading={FilterLines} size="md" color="secondary">
                                    More filters
                                </Button>
                            </div>
                            <Input
                                icon={SearchLg}
                                shortcut
                                aria-label="Search"
                                placeholder="Search platform owners"
                                size="sm"
                                className="w-80"
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        </div>
                        <div className="flex flex-col gap-3 lg:hidden">
                            <Input
                                icon={SearchLg}
                                shortcut
                                aria-label="Search"
                                placeholder="Search platform owners"
                                size="sm"
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                            <Button iconLeading={FilterLines} size="md" color="secondary">
                                More filters
                            </Button>
                            <div className="flex gap-3">
                                <BadgeWithButton
                                    color="gray"
                                    size="md"
                                    type="modern"
                                    buttonLabel="Clear"
                                    onButtonClick={() => {}}
                                >
                                    All time
                                </BadgeWithButton>
                            </div>
                        </div>

                        <TableCard.Root className="-mx-4 rounded-none lg:mx-0 lg:rounded-xl">
                            <Table
                                aria-label="Platform Owners"
                                sortDescriptor={sortDescriptor}
                                onSortChange={setSortDescriptor}
                            >
                                <Table.Header className="bg-primary">
                                    <Table.Head id="userId" isRowHeader allowsSorting label="User ID" className="w-full" />
                                    <Table.Head id="createdAt" allowsSorting label="Added Date" />
                                    <Table.Head id="status" label="Status" />
                                </Table.Header>
                                <Table.Body items={filteredAndSortedOwners}>
                                    {(owner) => (
                                        <Table.Row id={owner._id} highlightSelectedRow={false}>
                                            <Table.Cell className="lg:px-2">
                                                <div className="group flex items-center gap-3">
                                                    <Avatar
                                                        size="md"
                                                        placeholder={
                                                            <span className="flex items-center justify-center text-xs font-semibold text-quaternary">
                                                                {owner.userId.charAt(0).toUpperCase()}
                                                            </span>
                                                        }
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">
                                                            {owner.userId}
                                                        </p>
                                                        <p className="text-sm text-tertiary">
                                                            Platform Owner
                                                        </p>
                                                    </div>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div>
                                                    <p className="text-sm font-medium text-primary">
                                                        {new Date(owner.createdAt).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-tertiary">
                                                        {new Date(owner.createdAt).toLocaleTimeString("en-US", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <BadgeWithDot
                                                    size="sm"
                                                    type="modern"
                                                    color="success"
                                                >
                                                    Platform Owner
                                                </BadgeWithDot>
                                            </Table.Cell>
                                        </Table.Row>
                                    )}
                                </Table.Body>
                            </Table>
                            {filteredAndSortedOwners.length > 0 && (
                                <PaginationCardMinimal
                                    page={1}
                                    total={Math.ceil(filteredAndSortedOwners.length / 10)}
                                    align="left"
                                />
                            )}
                        </TableCard.Root>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AdminPage() {
    return (
        <ProtectedAdminRoute>
            <AdminDashboardContent />
        </ProtectedAdminRoute>
    );
}
