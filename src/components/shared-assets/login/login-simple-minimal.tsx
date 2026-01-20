"use client";

import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";

interface LoginSimpleMinimalProps {
    onSignIn?: (email: string, password: string) => Promise<void>;
    error?: string | null;
    isLoading?: boolean;
}

export const LoginSimpleMinimal = ({ onSignIn, error, isLoading }: LoginSimpleMinimalProps = {}) => {
    return (
        <section className="min-h-screen bg-primary px-4 py-12 md:px-8 md:pt-24">
            <div className="mx-auto flex w-full flex-col gap-8 sm:max-w-90">
                <div className="flex flex-col items-center gap-8 text-center md:gap-16">
                    <UntitledLogo className="w-35.5" />

                    <div className="flex flex-col gap-2 md:gap-3">
                        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Log in to your account</h1>
                        <p className="text-md text-tertiary">Welcome back! Please enter your details.</p>
                    </div>
                </div>

                <Form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const email = formData.get("email") as string;
                        const password = formData.get("password") as string;

                        if (onSignIn) {
                            await onSignIn(email, password);
                        } else {
                            console.log("Form data:", { email, password });
                        }
                    }}
                    className="flex flex-col gap-6"
                >
                    <div className="-space-y-px">
                        <Input
                            isRequired
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            size="md"
                            wrapperClassName="rounded-b-none focus-within:z-10"
                            inputClassName="autofill:rounded-b-none"
                        />
                        <Input
                            isRequired
                            type="password"
                            name="password"
                            size="md"
                            wrapperClassName="rounded-t-none focus-within:z-10"
                            inputClassName="autofill:rounded-t-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Button type="submit" size="lg" isDisabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                        <SocialButton social="google" theme="color" disabled={isLoading}>
                            Sign in with Google
                        </SocialButton>
                    </div>
                </Form>

                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex gap-1">
                        <span className="text-sm text-tertiary">Don&apos;t have an account?</span>
                        <Button href="/sign-up" color="link-color" size="md">
                            Sign up
                        </Button>
                    </div>
                    <Button href="#" color="link-color" size="md">
                        Forgot password
                    </Button>
                </div>
            </div>
        </section>
    );
};
