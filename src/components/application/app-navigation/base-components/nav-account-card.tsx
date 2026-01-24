"use client";

import type { FC, HTMLAttributes } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Placement } from "@react-types/overlays";
import { ChevronSelectorVertical, LogOut01, Settings01, User01 } from "@untitledui/icons";
import { useFocusManager } from "react-aria";
import type { DialogProps as AriaDialogProps } from "react-aria-components";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { ProfileSettingsModal } from "@/components/application/modals/profile-settings-modal";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useAdmin } from "@/hooks/use-admin";
import { signOut } from "@/lib/auth-client";
import { cx } from "@/utils/cx";

type NavAccountType = {
    /** Unique identifier for the nav item. */
    id: string;
    /** Name of the account holder. */
    name: string;
    /** Email address of the account holder. */
    email: string;
    /** Avatar image URL. */
    avatar: string;
    /** Online status of the account holder. This is used to display the online status indicator. */
    status: "online" | "offline";
};

const placeholderAccounts: NavAccountType[] = [
    {
        id: "olivia",
        name: "Olivia Rhye",
        email: "olivia@untitledui.com",
        avatar: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80",
        status: "online",
    },
    {
        id: "sienna",
        name: "Sienna Hewitt",
        email: "sienna@untitledui.com",
        avatar: "https://www.untitledui.com/images/avatars/transparent/sienna-hewitt?bg=%23E0E0E0",
        status: "online",
    },
];

export const NavAccountMenu = ({
    className,
    selectedAccountId: _selectedAccountId = "olivia",
    onCloseDropdown,
    isDropdownOpen: _isDropdownOpen,
    onDropdownLockChange,
    ...dialogProps
}: AriaDialogProps & {
    className?: string;
    accounts?: NavAccountType[];
    selectedAccountId?: string;
    onCloseDropdown?: () => void;
    isDropdownOpen?: boolean;
    onDropdownLockChange?: (locked: boolean) => void;
}) => {
    const router = useRouter();
    const focusManager = useFocusManager();
    const dialogRef = useRef<HTMLDivElement>(null);
    const { isPlatformOwner } = useAdmin();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    focusManager?.focusNext({ tabbable: true, wrap: true });
                    break;
                case "ArrowUp":
                    focusManager?.focusPrevious({ tabbable: true, wrap: true });
                    break;
            }
        },
        [focusManager],
    );

    useEffect(() => {
        const element = dialogRef.current;
        if (element) {
            element.addEventListener("keydown", onKeyDown);
        }

        return () => {
            if (element) {
                element.removeEventListener("keydown", onKeyDown);
            }
        };
    }, [onKeyDown]);

    useEffect(() => {
        if (isProfileModalOpen) {
            onCloseDropdown?.();
            onDropdownLockChange?.(true);
        } else {
            // Ensure dropdown is closed when modal closes
            onCloseDropdown?.();
            // Keep dropdown locked longer to prevent automatic reopen when focus returns
            // Use a longer delay to ensure focus has settled and any async operations complete
            const unlockTimer = setTimeout(() => {
                onDropdownLockChange?.(false);
            }, 600);
            return () => clearTimeout(unlockTimer);
        }
    }, [isProfileModalOpen, onCloseDropdown, onDropdownLockChange]);

    return (
        <AriaDialog
            {...dialogProps}
            ref={dialogRef}
            className={cx(
                "w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden",
                isProfileModalOpen && "hidden",
                className,
            )}
        >
            <div className="rounded-xl bg-primary ring-1 ring-secondary">
                <div className="flex flex-col gap-0.5 py-1.5">
                    <NavAccountCardMenuItem
                        label="View profile" 
                        icon={User01}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Close the dropdown first
                            if (onCloseDropdown) {
                                onCloseDropdown();
                            }
                            // Wait for dropdown closing animation to complete (150ms) plus buffer, then open modal
                            setTimeout(() => {
                                setIsProfileModalOpen(true);
                            }, 250);
                        }}
                    />
                    <NavAccountCardMenuItem 
                        label={isPlatformOwner ? "Admin area" : "Account settings"} 
                        icon={Settings01}
                        onClick={() => {
                            if (isPlatformOwner) {
                                router.push("/admin");
                            }
                        }}
                    />
                </div>
            </div>

            <div className="pt-1 pb-1.5">
                <NavAccountCardMenuItem 
                    label="Log out" 
                    icon={LogOut01}
                    onClick={async () => {
                        await signOut();
                        router.push("/login");
                    }}
                />
            </div>
            
            <ProfileSettingsModal 
                isOpen={isProfileModalOpen} 
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        // When closing modal, immediately close dropdown and lock it
                        onCloseDropdown?.();
                        onDropdownLockChange?.(true);
                    }
                    setIsProfileModalOpen(nextOpen);
                }} 
            />
        </AriaDialog>
    );
};

const NavAccountCardMenuItem = ({
    icon: Icon,
    label,
    shortcut,
    ...buttonProps
}: {
    icon?: FC<{ className?: string }>;
    label: string;
    shortcut?: string;
} & HTMLAttributes<HTMLButtonElement>) => {
    return (
        <button {...buttonProps} className={cx("group/item w-full cursor-pointer px-1.5 focus:outline-hidden", buttonProps.className)}>
            <div
                className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-md p-2 group-hover/item:bg-primary_hover",
                    // Focus styles.
                    "outline-focus-ring group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-2",
                )}
            >
                <div className="flex gap-2 text-sm font-semibold text-secondary group-hover/item:text-secondary_hover">
                    {Icon && <Icon className="size-5 text-fg-quaternary" />} {label}
                </div>

                {shortcut && (
                    <kbd className="flex rounded px-1 py-px font-body text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset">{shortcut}</kbd>
                )}
            </div>
        </button>
    );
};

export const NavAccountCard = ({
    popoverPlacement,
    selectedAccountId = "olivia",
    items = placeholderAccounts,
}: {
    popoverPlacement?: Placement;
    selectedAccountId?: string;
    items?: NavAccountType[];
}) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const isDesktop = useBreakpoint("lg");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDropdownLocked, setIsDropdownLocked] = useState(false);

    const selectedAccount = placeholderAccounts.find((account) => account.id === selectedAccountId);

    if (!selectedAccount) {
        console.warn(`Account with ID ${selectedAccountId} not found in <NavAccountCard />`);
        return null;
    }

    return (
        <div ref={triggerRef} className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <AvatarLabelGroup
                size="md"
                src={selectedAccount.avatar}
                title={selectedAccount.name}
                subtitle={selectedAccount.email}
                status={selectedAccount.status}
            />

            <div className="absolute top-1.5 right-1.5">
                <AriaDialogTrigger
                    isOpen={isDropdownOpen}
                    onOpenChange={(nextOpen) => {
                        if (nextOpen && isDropdownLocked) {
                            return;
                        }
                        setIsDropdownOpen(nextOpen);
                    }}
                >
                    <AriaButton className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover pressed:text-fg-quaternary_hover">
                        <ChevronSelectorVertical className="size-4 shrink-0" />
                    </AriaButton>
                    <AriaPopover
                        placement={popoverPlacement ?? (isDesktop ? "right bottom" : "top right")}
                        triggerRef={triggerRef}
                        offset={8}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "origin-(--trigger-anchor-point) will-change-transform",
                                isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                                isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                            )
                        }
                    >
                        <NavAccountMenu 
                            selectedAccountId={selectedAccountId} 
                            accounts={items}
                            isDropdownOpen={isDropdownOpen}
                            onCloseDropdown={() => setIsDropdownOpen(false)}
                            onDropdownLockChange={setIsDropdownLocked}
                        />
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>
        </div>
    );
};
