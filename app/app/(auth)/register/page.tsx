'use client';

import { RegisterForm } from "@/src/components/auth/RegisterForm";
import { useAuthRedirect } from "@/src/hooks/auth/useAuthRedirect";
import { routes } from "@/src/config/proxy.config";

export default function Register() {
    // After registration, redirect to verify-email page instead of dashboard
    useAuthRedirect({
        redirectIfAuthenticated: true,
        redirectTo: routes.afterRegister,
    });

    return (
        <div className="flex justify-center items-start pt-24">
            <RegisterForm />
        </div>
    );
}
