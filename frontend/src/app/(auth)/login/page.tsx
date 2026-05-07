// src/app/(auth)/login/page.tsx
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthWrapper from "@/components/auth/AuthPage";
import { notifyAuthUpdated } from "@/components/auth/authEvents";
import { useLocale } from "@/components/locale/LocaleProvider";
import { loginUser } from "@/services/authService";

export default function LoginPage() {
    const router = useRouter();
    const { t } = useLocale();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const data = await loginUser({ email, password });
            localStorage.setItem("token", data.access_token);
            notifyAuthUpdated();
            toast.success("Login successful");
            router.push("/");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Login failed");
        }
    }

    return (
        <AuthWrapper
            title={t("auth_login_title")}
            description={t("auth_login_desc")}
            imageSide="left"
        >
            <form onSubmit={handleSubmit}>
                <h2 className="text-3xl font-bold text-foreground">{t("auth_sign_in")}</h2>

                <input
                    className="mt-8 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-500"
                    type="email"
                    placeholder={t("auth_email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-500"
                    type="password"
                    placeholder={t("auth_password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button className="mt-6 w-full rounded-xl bg-yellow-400 py-3 font-semibold text-neutral-950 transition hover:bg-yellow-500">
                    {t("auth_sign_in")}
                </button>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t("auth_no_account")}{" "}
                    <Link href="/register" className="font-semibold text-yellow-600">
                        {t("auth_create_account_link")}
                    </Link>
                </p>
            </form>
        </AuthWrapper>
    );
}
