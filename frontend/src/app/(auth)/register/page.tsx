// src/app/(auth)/register/page.tsx
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthWrapper from "@/components/auth/AuthPage";
import { useLocale } from "@/components/locale/LocaleProvider";
import { registerUser } from "@/services/authService";

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useLocale();

    const [role, setRole] = useState<"buyer" | "seller">("buyer");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [phoneNumber, setPhoneNumber] = useState("");
    const [shopName, setShopName] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            await registerUser({
                full_name: name,
                email,
                password,
                role,
                phone: role === "seller" ? phoneNumber : undefined,
                shop_name: role === "seller" ? shopName : undefined,
            });

            toast.success("Account created");
            router.push("/login");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Register failed");
        }
    }

    return (
        <AuthWrapper
            title={t("auth_register_title")}
            description={t("auth_register_desc")}
            imageSide="right"
        >
            <form onSubmit={handleSubmit}>
                <h2 className="text-3xl font-bold text-foreground">{t("auth_register")}</h2>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setRole("buyer")}
                        className={`rounded-xl border px-4 py-3 font-semibold ${role === "buyer"
                            ? "border-yellow-500 bg-yellow-400 text-neutral-950"
                            : "border-border bg-background text-foreground"
                            }`}
                    >
                        {t("auth_buyer")}
                    </button>

                    <button
                        type="button"
                        onClick={() => setRole("seller")}
                        className={`rounded-xl border px-4 py-3 font-semibold ${role === "seller"
                            ? "border-yellow-500 bg-yellow-400 text-neutral-950"
                            : "border-border bg-background text-foreground"
                            }`}
                    >
                        {t("auth_seller")}
                    </button>
                </div>

                <input
                    className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-500"
                    type="text"
                    placeholder={t("auth_full_name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <input
                    className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-500"
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

                {role === "seller" && (
                    <>
                        <input
                            className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-500"
                            type="text"
                            placeholder={t("auth_phone")}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />

                        <input
                            className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-500"
                            type="text"
                            placeholder={t("auth_shop_name")}
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            required
                        />
                    </>
                )}

                <button className="mt-6 w-full rounded-xl bg-yellow-400 py-3 font-semibold text-neutral-950 transition hover:bg-yellow-500">
                    {t("auth_register")}
                </button>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t("auth_have_account")}{" "}
                    <Link href="/login" className="font-semibold text-yellow-600">
                        {t("auth_login_link")}
                    </Link>
                </p>
            </form>
        </AuthWrapper>
    );
}
