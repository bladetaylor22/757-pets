"use client";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    // Layout just passes through children - protection and UI are handled in page component
    return <>{children}</>;
}
