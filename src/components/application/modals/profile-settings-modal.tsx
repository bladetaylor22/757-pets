"use client";

import { useState, useEffect, useRef } from "react";
import { UploadCloud02 } from "@untitledui/icons";
import { DialogTrigger as AriaDialogTrigger, Heading as AriaHeading } from "react-aria-components";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Form } from "@/components/base/form/form";
import { InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Format phone number to US format: (XXX) XXX-XXXX
 */
const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, "");
    
    // Format based on length
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

/**
 * Remove formatting from phone number
 */
const unformatPhoneNumber = (value: string): string => {
    return value.replace(/\D/g, "");
};

export const ProfileSettingsModal = ({ 
    isOpen: controlledIsOpen, 
    onOpenChange: controlledOnOpenChange 
}: { 
    isOpen?: boolean; 
    onOpenChange?: (isOpen: boolean) => void;
} = {}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = controlledOnOpenChange || setInternalIsOpen;
    
    const { user } = useAuth();
    const updateUserProfile = useMutation(api.auth.updateUserProfile);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const getFileUrlMutation = useMutation(api.files.getFileUrlMutation);
    const [avatarStorageId, setAvatarStorageId] = useState<Id<"_storage"> | null>(null);
    const fileUrl = useQuery(
        api.files.getFileUrl,
        avatarStorageId ? { storageId: avatarStorageId } : "skip"
    );
    
    // Form state - initial values
    const [initialName, setInitialName] = useState("");
    const [initialPhoneNumber, setInitialPhoneNumber] = useState("");
    const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);
    
    // Form state - current values
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    
    // Loading and error states
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form with user data when modal opens or user data changes
    useEffect(() => {
        if (isOpen && user) {
            const userName = user.name || "";
            const userPhoneRaw = user.phoneNumber || "";
            const userPhoneFormatted = userPhoneRaw ? formatPhoneNumber(userPhoneRaw) : "";
            const userImage = user.image || null;
            
            setInitialName(userName);
            setInitialPhoneNumber(userPhoneFormatted);
            setInitialAvatarUrl(userImage);
            
            setName(userName);
            setPhoneNumber(userPhoneFormatted);
            setAvatarFile(null);
            setAvatarPreviewUrl(null);
            setAvatarStorageId(null);
            setError(null);
        }
    }, [isOpen, user]);

    // Update avatar URL when file URL query resolves (after upload)
    useEffect(() => {
        if (fileUrl && avatarStorageId) {
            setInitialAvatarUrl(fileUrl);
            setAvatarPreviewUrl(fileUrl);
        }
    }, [fileUrl, avatarStorageId]);

    // Check if form has been modified
    const hasChanges = () => {
        const nameStr = String(name || "");
        const initialNameStr = String(initialName || "");
        const nameChanged = nameStr.trim() !== initialNameStr.trim();
        
        const phoneStr = String(phoneNumber || "");
        const initialPhoneStr = String(initialPhoneNumber || "");
        const phoneChanged = unformatPhoneNumber(phoneStr) !== unformatPhoneNumber(initialPhoneStr);
        
        const avatarChanged = avatarFile !== null || (avatarStorageId !== null && fileUrl);
        
        return nameChanged || phoneChanged || avatarChanged;
    };

    const handleAvatarFileSelect = (files: FileList) => {
        const file = files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        setError(null);
        setAvatarFile(file);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreviewUrl(previewUrl);
    };

    const handlePhoneNumberChange = (value: string) => {
        // Format the phone number as user types
        const valueStr = String(value || "");
        const formatted = formatPhoneNumber(valueStr);
        setPhoneNumber(formatted);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!(name || "").trim()) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload avatar file if one was selected
            let imageUrl: string | undefined = undefined;
            
            if (avatarFile) {
                setIsUploading(true);
                try {
                    // Step 1: Generate upload URL
                    const uploadUrl = await generateUploadUrl();

                    // Step 2: Upload file to storage
                    const result = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": avatarFile.type },
                        body: avatarFile,
                    });

                    if (!result.ok) {
                        throw new Error("Failed to upload file");
                    }

                    const { storageId } = await result.json();
                    const storageIdTyped = storageId as Id<"_storage">;
                    setAvatarStorageId(storageIdTyped);
                    
                    // Step 3: Get file URL using mutation (synchronous in submit handler)
                    const uploadedFileUrl = await getFileUrlMutation({ storageId: storageIdTyped });
                    if (!uploadedFileUrl) {
                        throw new Error("Failed to get file URL");
                    }
                    imageUrl = uploadedFileUrl;
                } catch (err) {
                    console.error("Error uploading avatar:", err);
                    setError("Failed to upload image. Please try again.");
                    setIsUploading(false);
                    setIsSubmitting(false);
                    return;
                } finally {
                    setIsUploading(false);
                }
            } else if (avatarStorageId && fileUrl) {
                // Use existing uploaded file URL
                imageUrl = fileUrl;
            } else if (initialAvatarUrl) {
                // Keep existing avatar
                imageUrl = initialAvatarUrl;
            }

            // Build update payload
            const updateData: {
                name: string;
                phoneNumber?: string;
                image?: string;
            } = {
                name: (name || "").trim(),
            };

            const cleanedPhone = unformatPhoneNumber(phoneNumber || "");
            if (cleanedPhone) {
                updateData.phoneNumber = cleanedPhone;
            }

            if (imageUrl) {
                updateData.image = imageUrl;
            }

            await updateUserProfile(updateData);
            
            // Clean up preview URL if we created one
            if (avatarPreviewUrl && avatarFile) {
                URL.revokeObjectURL(avatarPreviewUrl);
            }
            
            // Close modal on success
            setIsOpen(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to update profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Reset form to initial values without closing modal
        setName(initialName);
        setPhoneNumber(initialPhoneNumber);
        setAvatarFile(null);
        if (avatarPreviewUrl && avatarFile) {
            URL.revokeObjectURL(avatarPreviewUrl);
        }
        setAvatarPreviewUrl(null);
        setAvatarStorageId(null);
        setError(null);
    };

    const handleClose = () => {
        // If there are changes, reset them first (treat as cancel)
        if (hasChanges()) {
            handleCancel();
        }
        // Close the modal
        setIsOpen(false);
    };

    // Determine which avatar URL to display
    const displayAvatarUrl = avatarPreviewUrl || initialAvatarUrl || user?.image || undefined;
    const formHasChanges = hasChanges();

    return (
        <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
            <ModalOverlay isDismissable>
                <Modal>
                    <Dialog>
                        <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl sm:max-w-120">
                            <CloseButton onClick={handleClose} theme="light" size="lg" className="absolute top-3 right-3" />
                            <div className="flex flex-col gap-0.5 px-4 pt-5 sm:px-6 sm:pt-6">
                                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                    Profile Settings
                                </AriaHeading>
                                <p className="text-sm text-tertiary">Update your profile information.</p>
                            </div>

                            <div className="h-5 w-full" />
                            <Form
                                id="profile-settings-form-modal"
                                className="flex flex-col gap-4 px-4 sm:px-6"
                                onSubmit={handleSubmit}
                            >
                                {/* Avatar Upload Section */}
                                <div className="flex w-full items-center gap-5 md:items-start">
                                    <Avatar 
                                        verified 
                                        size="2xl" 
                                        src={displayAvatarUrl}
                                        alt={name || user?.name || "Profile"}
                                    />
                                    <div className="flex flex-col gap-2 flex-1">
                                        <Button 
                                            type="button"
                                            color="secondary" 
                                            size="md" 
                                            iconLeading={UploadCloud02} 
                                            className="md:hidden"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Upload photo
                                        </Button>
                                        <FileUploadDropZone 
                                            className="w-full max-md:hidden" 
                                            accept="image/*"
                                            maxSize={10 * 1024 * 1024}
                                            onDropFiles={handleAvatarFileSelect}
                                        />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const target = e.target as HTMLInputElement;
                                                if (target.files) {
                                                    handleAvatarFileSelect(target.files);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Name Input */}
                                <InputGroup
                                    isRequired
                                    label="Name"
                                    name="name"
                                    size="md"
                                    value={name || ""}
                                    onChange={(value) => setName(String(value || ""))}
                                >
                                    <InputBase 
                                        placeholder="Enter your name"
                                    />
                                </InputGroup>

                                {/* Email Input (Disabled) */}
                                <InputGroup
                                    label="Email"
                                    name="email"
                                    size="md"
                                >
                                    <InputBase 
                                        type="email"
                                        value={user?.email || ""}
                                        isDisabled
                                    />
                                </InputGroup>

                                {/* Phone Number Input */}
                                <InputGroup
                                    label="Phone Number"
                                    name="phoneNumber"
                                    size="md"
                                    value={phoneNumber || ""}
                                    onChange={(value) => handlePhoneNumberChange(String(value || ""))}
                                >
                                    <InputBase 
                                        type="tel"
                                        placeholder="(XXX) XXX-XXXX"
                                        maxLength={14}
                                    />
                                </InputGroup>

                                {/* Error Message */}
                                {error && (
                                    <div className="rounded-lg bg-error/10 p-3 text-sm text-error-primary">
                                        {error}
                                    </div>
                                )}
                            </Form>

                            <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 sm:flex sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:pt-8 sm:pb-6">
                                {formHasChanges && (
                                    <Button 
                                        color="secondary" 
                                        size="lg" 
                                        onClick={handleCancel}
                                        isDisabled={isSubmitting || isUploading}
                                        className="w-full sm:w-auto sm:flex-1"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button 
                                    type="submit" 
                                    form="profile-settings-form-modal"
                                    color="primary" 
                                    size="lg"
                                    isDisabled={!formHasChanges || isSubmitting || isUploading}
                                    className={formHasChanges ? "w-full sm:w-auto sm:flex-1" : "w-full"}
                                >
                                    {isSubmitting ? "Saving..." : isUploading ? "Uploading..." : "Save changes"}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </AriaDialogTrigger>
    );
};
