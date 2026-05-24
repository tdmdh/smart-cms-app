'use client';

import { LoginForm } from "@/src/components/auth";
import { useAuthRedirect } from "@/src/hooks/auth/useAuthRedirect";

export default function Login() {
    // Redirect to dashboard if user becomes authenticated
    useAuthRedirect({ redirectIfAuthenticated: true });

    return (
        <div className="flex items-start justify-center h-screen pt-24">
            <LoginForm />
        </div>
    );
}