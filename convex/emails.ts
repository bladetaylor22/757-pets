import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { authComponent } from "./auth";

// Initialize the Resend component client
export const resend: Resend = new Resend(components.resend, {
    testMode: false, // Production mode - allows sending to real email addresses
});

// Get the "From" email address from environment variable
const getFromEmail = (): string => {
    const fromEmail = process.env.RESEND_FROM;
    if (!fromEmail) {
        throw new Error("RESEND_FROM environment variable is not set");
    }
    return fromEmail;
};

// Internal mutation to send email verification email
export const sendVerificationEmailInternal = internalMutation({
    args: {
        to: v.string(),
        url: v.string(),
        token: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            console.log("Sending verification email to:", args.to);
            const fromEmail = getFromEmail();
            console.log("From email:", fromEmail);
            
            const subject = "Verify your email address";
            const html = `
                <html>
                    <body>
                        <h2>Welcome${args.name ? `, ${args.name}` : ""}!</h2>
                        <p>Please verify your email address by clicking the link below:</p>
                        <p><a href="${args.url}">Verify Email</a></p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p>${args.url}</p>
                        <p>If you didn't create an account, you can safely ignore this email.</p>
                    </body>
                </html>
            `;
            const text = `
Welcome${args.name ? `, ${args.name}` : ""}!

Please verify your email address by clicking the link below:

${args.url}

If you didn't create an account, you can safely ignore this email.
            `.trim();

            const emailId = await resend.sendEmail(ctx, {
                from: fromEmail,
                to: args.to,
                subject,
                html,
                text,
            });
            
            console.log("Verification email sent successfully, emailId:", emailId);
        } catch (error) {
            console.error("Error sending verification email:", error);
            throw error;
        }
    },
});

// Internal mutation to send password reset email
export const sendResetPasswordInternal = internalMutation({
    args: {
        to: v.string(),
        url: v.string(),
        token: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            console.log("Sending password reset email to:", args.to);
            const fromEmail = getFromEmail();
            console.log("From email:", fromEmail);
            
            const subject = "Reset your password";
            const html = `
                <html>
                    <body>
                        <h2>Password Reset Request</h2>
                        <p>Hi${args.name ? ` ${args.name}` : ""},</p>
                        <p>You requested to reset your password. Click the link below to reset it:</p>
                        <p><a href="${args.url}">Reset Password</a></p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p>${args.url}</p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    </body>
                </html>
            `;
            const text = `
Password Reset Request

Hi${args.name ? ` ${args.name}` : ""},

You requested to reset your password. Click the link below to reset it:

${args.url}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
            `.trim();

            const emailId = await resend.sendEmail(ctx, {
                from: fromEmail,
                to: args.to,
                subject,
                html,
                text,
            });
            
            console.log("Password reset email sent successfully, emailId:", emailId);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            throw error;
        }
    },
});

// Public mutation to send a test email to the authenticated user
export const sendTestEmail = mutation({
    args: {},
    handler: async (ctx) => {
        // Get the authenticated user
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new ConvexError({
                code: "UNAUTHENTICATED",
                message: "You must be logged in to send a test email",
            });
        }

        try {
            console.log("Sending test email to:", user.email);
            const fromEmail = getFromEmail();
            console.log("From email:", fromEmail);

            const subject = "Test Email from 757 PETS";
            const html = `
                <html>
                    <body>
                        <h2>Test Email</h2>
                        <p>Hi${user.name ? ` ${user.name}` : ""}!</p>
                        <p>This is a test email from your 757 PETS application.</p>
                        <p>If you received this email, your email configuration is working correctly! ✅</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">
                            <strong>Email Details:</strong><br>
                            To: ${user.email}<br>
                            From: ${fromEmail}<br>
                            Sent at: ${new Date().toLocaleString()}
                        </p>
                    </body>
                </html>
            `;
            const text = `
Test Email

Hi${user.name ? ` ${user.name}` : ""}!

This is a test email from your 757 PETS application.

If you received this email, your email configuration is working correctly! ✅

Email Details:
To: ${user.email}
From: ${fromEmail}
Sent at: ${new Date().toLocaleString()}
            `.trim();

            // Check if RESEND_API_KEY is set
            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) {
                throw new ConvexError({
                    code: "CONFIGURATION_ERROR",
                    message: "RESEND_API_KEY environment variable is not set in Convex",
                });
            }
            console.log("RESEND_API_KEY is set:", apiKey.substring(0, 10) + "...");

            const emailId = await resend.sendEmail(ctx, {
                from: fromEmail,
                to: user.email,
                subject,
                html,
                text,
            });

            console.log("Test email queued successfully, emailId:", emailId);
            
            return {
                success: true,
                emailId,
                message: "Test email queued successfully! It will be sent shortly. Check your inbox and Resend dashboard.",
            };
        } catch (error) {
            console.error("Error sending test email:", error);
            throw new ConvexError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to send test email: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
        }
    },
});
