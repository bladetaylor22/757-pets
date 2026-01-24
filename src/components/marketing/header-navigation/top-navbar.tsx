"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { BookClosed, FileCode01, PlayCircle, Stars02, ChevronDown } from "@untitledui/icons";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { TopNavbarMenuItemLink } from "./top-navbar-base/top-navbar-menu-item";
import { FeatureCardVertical } from "./top-navbar-base/top-navbar-feature-card";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import { cx } from "@/utils/cx";
import { useAuth } from "@/hooks/use-auth";

type TopNavbarItem = {
    label: string;
    href?: string;
    menu?: ReactNode;
};

// Dropdown menu component duplicated from dropdown-menu-feature-card.tsx
const TopNavbarDropdownMenuFeatureCard = () => {
    const items = [
        { title: "Blog", subtitle: "The latest industry new and guides curated by our expert team.", href: "/", Icon: BookClosed },
        { title: "Customer stories", subtitle: "Learn how our customers are using Untitled UI to 10x their growth.", href: "/", Icon: Stars02 },
        { title: "Video tutorials", subtitle: "Get up and running on our newest features and in-depth guides.", href: "/", Icon: PlayCircle },
        { title: "Documentation", subtitle: "In-depth articles on our tools and technologies to empower teams.", href: "/", Icon: FileCode01 },
    ];

    return (
        <div className="px-3 pb-2 md:max-w-160 md:p-0">
            <nav className="flex flex-col overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary_alt md:w-max md:flex-row md:rounded-2xl md:shadow-lg">
                <ul className="flex flex-1 flex-col gap-0.5 pt-2 pb-3 md:p-2">
                    {items.map(({ title, subtitle, href, Icon }) => (
                        <li key={title + href}>
                            <TopNavbarMenuItemLink icon={Icon} title={title} subtitle={subtitle} href={href} />
                        </li>
                    ))}
                </ul>
                <div className="bg-secondary px-1 pt-2 pb-3 md:max-w-76 md:px-2">
                    <FeatureCardVertical
                        href="#"
                        imgSrc="https://www.untitledui.com/marketing/smiling-girl.webp"
                        title="We've just released an update!"
                        description="Check out the all new dashboard view. Pages now load up to 3x faster."
                        actionsContent={
                            <div className="inline-flex gap-3">
                                <Button color="link-gray" size="sm">
                                    Dismiss
                                </Button>
                                <Button color="link-color" size="sm">
                                    Changelog
                                </Button>
                            </div>
                        }
                    />
                </div>
            </nav>
        </div>
    );
};

const topNavbarItems: TopNavbarItem[] = [
    { label: "Products", href: "/products", menu: <TopNavbarDropdownMenuFeatureCard /> },
    { label: "Services", href: "/services", menu: <TopNavbarDropdownMenuFeatureCard /> },
    { label: "Pricing", href: "/pricing" },
    { label: "Resources", href: "/resources", menu: <TopNavbarDropdownMenuFeatureCard /> },
    { label: "About", href: "/about" },
];

const footerNavItems = [
    { label: "About us", href: "/" },
    { label: "Press", href: "/products" },
    { label: "Careers", href: "/resources" },
    { label: "Legal", href: "/pricing" },
    { label: "Support", href: "/pricing" },
    { label: "Contact", href: "/pricing" },
    { label: "Sitemap", href: "/pricing" },
    { label: "Cookie settings", href: "/pricing" },
];

const MobileNavItem = (props: { className?: string; label: string; href?: string; children?: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (props.href) {
        return (
            <li>
                <a href={props.href} className="flex items-center justify-between px-4 py-3 text-md font-semibold text-primary hover:bg-primary_hover">
                    {props.label}
                </a>
            </li>
        );
    }

    return (
        <li className="flex flex-col gap-0.5">
            <button
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-4 py-3 text-md font-semibold text-primary hover:bg-primary_hover"
            >
                {props.label}{" "}
                <ChevronDown
                    className={cx("size-4 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear", isOpen ? "-rotate-180" : "rotate-0")}
                />
            </button>
            {isOpen && <div>{props.children}</div>}
        </li>
    );
};

const MobileFooter = ({ isAuthenticated, user, isLoading }: { isAuthenticated: boolean; user?: { name?: string | null; email?: string | null; image?: string | null } | null; isLoading?: boolean }) => {

    // Generate initials from user name or email
    const getInitials = () => {
        if (user?.name) {
            const names = user.name.split(" ");
            if (names.length >= 2) {
                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
            }
            return user.name.substring(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return "U";
    };

    const userDisplayName = user?.name || user?.email || "User";

    return (
        <div className="flex flex-col gap-8 border-t border-secondary px-4 py-6">
            <div>
                <ul className="grid grid-flow-col grid-cols-2 grid-rows-4 gap-x-6 gap-y-3">
                    {footerNavItems.map((navItem) => (
                        <li key={navItem.label}>
                            <Button color="link-gray" size="lg" href={navItem.href}>
                                {navItem.label}
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex flex-col gap-3">
                {isLoading ? null : !isAuthenticated ? (
                    <>
                        <Button size="lg" href="/sign-up">Sign up</Button>
                        <Button color="secondary" size="lg" href="/login">
                            Log in
                        </Button>
                    </>
                ) : (
                    <div className="flex items-center justify-center">
                        <AriaDialogTrigger>
                            <AriaButton
                                className={({ isPressed, isFocused }) =>
                                    cx(
                                        "group relative inline-flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 w-full",
                                        (isPressed || isFocused) && "outline-2 outline-offset-2 outline-focus-ring",
                                        "hover:bg-primary_hover"
                                    )
                                }
                            >
                                <Avatar 
                                    alt={userDisplayName} 
                                    src={user?.image || undefined}
                                    size="md"
                                    placeholder={
                                        <span className="flex items-center justify-center text-xs font-semibold text-quaternary">
                                            {getInitials()}
                                        </span>
                                    }
                                />
                                <span className="text-sm font-semibold text-primary">{userDisplayName}</span>
                            </AriaButton>
                            <AriaPopover
                                placement="top right"
                                offset={8}
                                className={({ isEntering, isExiting }) =>
                                    cx(
                                        "will-change-transform",
                                        isEntering &&
                                            "duration-300 ease-out animate-in fade-in placement-right:slide-in-from-left-2 placement-top:slide-in-from-bottom-2 placement-bottom:slide-in-from-top-2",
                                        isExiting &&
                                            "duration-150 ease-in animate-out fade-out placement-right:slide-out-to-left-2 placement-top:slide-out-to-bottom-2 placement-bottom:slide-out-to-top-2",
                                    )
                                }
                            >
                                <NavAccountMenu />
                            </AriaPopover>
                        </AriaDialogTrigger>
                    </div>
                )}
            </div>
        </div>
    );
};

interface TopNavbarProps {
    items?: TopNavbarItem[];
    isFullWidth?: boolean;
    isFloating?: boolean;
    className?: string;
}

export const TopNavbar = ({ items = topNavbarItems, isFullWidth, isFloating, className }: TopNavbarProps) => {
    const headerRef = useRef<HTMLElement>(null);
    const { isAuthenticated, user, isLoading } = useAuth();

    // Generate initials from user name or email
    const getInitials = () => {
        if (user?.name) {
            const names = user.name.split(" ");
            if (names.length >= 2) {
                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
            }
            return user.name.substring(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return "U";
    };

    const userDisplayName = user?.name || user?.email || "User";

    return (
        <header
            ref={headerRef}
            className={cx(
                "relative flex h-18 w-full items-center justify-center md:h-20",
                isFloating && "h-16 md:h-19 md:pt-3",
                isFullWidth && !isFloating ? "has-aria-expanded:bg-primary" : "max-md:has-aria-expanded:bg-primary",
                className,
            )}
        >
            <div className="flex size-full max-w-container flex-1 items-center pr-3 pl-4 md:px-8">
                <div
                    className={cx(
                        "flex w-full justify-between gap-4",
                        isFloating && "ring-secondary_alt md:rounded-2xl md:bg-primary md:py-3 md:pr-3 md:pl-4 md:shadow-xs md:ring-1",
                    )}
                >
                    <div className="flex flex-1 items-center gap-5">
                        <UntitledLogo className="h-8 md:max-lg:hidden" />
                        <UntitledLogoMinimal className="hidden h-8 md:inline-block lg:hidden" />

                        {/* Desktop navigation */}
                        <nav className="max-md:hidden">
                            <ul className="flex items-center gap-0.5">
                                {items.map((navItem) => (
                                    <li key={navItem.label}>
                                        {navItem.menu ? (
                                            <AriaDialogTrigger>
                                                <AriaButton className="flex cursor-pointer items-center gap-0.5 rounded-lg px-1.5 py-1 text-md font-semibold text-secondary outline-focus-ring transition duration-100 ease-linear hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2">
                                                    <span className="px-0.5">{navItem.label}</span>

                                                    <ChevronDown className="size-4 rotate-0 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear in-aria-expanded:-rotate-180" />
                                                </AriaButton>

                                                <AriaPopover
                                                    placement="bottom"
                                                    className={({ isEntering, isExiting }) =>
                                                        cx(
                                                            "hidden origin-top will-change-transform md:block",
                                                            isFullWidth && "w-full",
                                                            isEntering && "duration-200 ease-out animate-in fade-in slide-in-from-top-1",
                                                            isExiting && "duration-150 ease-in animate-out fade-out slide-out-to-top-1",
                                                        )
                                                    }
                                                    offset={isFloating || isFullWidth ? 0 : 8}
                                                    containerPadding={16}
                                                    shouldFlip={true}
                                                    triggerRef={(isFloating && isFullWidth) || isFullWidth ? headerRef : undefined}
                                                >
                                                    {({ isEntering, isExiting }) => (
                                                        <AriaDialog
                                                            className={cx(
                                                                "mx-auto origin-top outline-hidden",
                                                                isFloating && "max-w-7xl px-8 pt-3",
                                                                // Have to use the scale animation inside the popover to avoid
                                                                // miscalculating the popover's position when opening.
                                                                isEntering && !isFullWidth && "duration-200 ease-out animate-in zoom-in-95",
                                                                isExiting && !isFullWidth && "duration-150 ease-in animate-out zoom-out-95",
                                                            )}
                                                        >
                                                            {navItem.menu}
                                                        </AriaDialog>
                                                    )}
                                                </AriaPopover>
                                            </AriaDialogTrigger>
                                        ) : (
                                            <a
                                                href={navItem.href}
                                                className="flex cursor-pointer items-center gap-0.5 rounded-lg px-1.5 py-1 text-md font-semibold text-secondary outline-focus-ring transition duration-100 ease-linear hover:text-secondary_hover focus:outline-offset-2 focus-visible:outline-2"
                                            >
                                                <span className="px-0.5">{navItem.label}</span>
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        {isLoading ? null : isAuthenticated ? (
                            <AriaDialogTrigger>
                                <AriaButton
                                    className={({ isPressed, isFocused }) =>
                                        cx(
                                            "group relative inline-flex cursor-pointer",
                                            (isPressed || isFocused) && "rounded-full outline-2 outline-offset-2 outline-focus-ring",
                                        )
                                    }
                                >
                                    <Avatar 
                                        alt={userDisplayName} 
                                        src={user?.image || undefined}
                                        size="md"
                                        placeholder={
                                            <span className="flex items-center justify-center text-xs font-semibold text-quaternary">
                                                {getInitials()}
                                            </span>
                                        }
                                    />
                                </AriaButton>
                                <AriaPopover
                                    placement="bottom right"
                                    offset={8}
                                    className={({ isEntering, isExiting }) =>
                                        cx(
                                            "will-change-transform",
                                            isEntering &&
                                                "duration-300 ease-out animate-in fade-in placement-right:slide-in-from-left-2 placement-top:slide-in-from-bottom-2 placement-bottom:slide-in-from-top-2",
                                            isExiting &&
                                                "duration-150 ease-in animate-out fade-out placement-right:slide-out-to-left-2 placement-top:slide-out-to-bottom-2 placement-bottom:slide-out-to-top-2",
                                        )
                                    }
                                >
                                    <NavAccountMenu />
                                </AriaPopover>
                            </AriaDialogTrigger>
                        ) : (
                            <>
                                <Button color="secondary" size={isFloating ? "md" : "lg"} href="/login">
                                    Log in
                                </Button>
                                <Button color="primary" size={isFloating ? "md" : "lg"} href="/sign-up">
                                    Sign up
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu and menu trigger */}
                    <AriaDialogTrigger>
                        <AriaButton
                            aria-label="Toggle navigation menu"
                            className={({ isFocusVisible, isHovered }) =>
                                cx(
                                    "group ml-auto cursor-pointer rounded-lg p-2 md:hidden",
                                    isHovered && "bg-primary_hover",
                                    isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                                )
                            }
                        >
                            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path
                                    className="hidden text-secondary group-aria-expanded:block"
                                    d="M18 6L6 18M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    className="text-secondary group-aria-expanded:hidden"
                                    d="M3 12H21M3 6H21M3 18H21"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </AriaButton>
                        <AriaPopover
                            triggerRef={headerRef}
                            className="h-calc(100%-72px) scrollbar-hide w-full overflow-y-auto shadow-lg md:hidden"
                            offset={0}
                            crossOffset={20}
                            containerPadding={0}
                            placement="bottom left"
                        >
                            <AriaDialog className="outline-hidden">
                                <nav className="w-full bg-primary shadow-lg">
                                    <ul className="flex flex-col gap-0.5 py-5">
                                        {items.map((navItem) =>
                                            navItem.menu ? (
                                                <MobileNavItem key={navItem.label} label={navItem.label}>
                                                    {navItem.menu}
                                                </MobileNavItem>
                                            ) : (
                                                <MobileNavItem key={navItem.label} label={navItem.label} href={navItem.href} />
                                            ),
                                        )}
                                    </ul>

                                    <MobileFooter isAuthenticated={isAuthenticated} user={user} isLoading={isLoading ?? undefined} />
                                </nav>
                            </AriaDialog>
                        </AriaPopover>
                    </AriaDialogTrigger>
                </div>
            </div>
        </header>
    );
};
