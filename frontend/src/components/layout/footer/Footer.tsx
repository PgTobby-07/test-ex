"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale/LocaleProvider";

export default function Footer() {
    const { t } = useLocale();

    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
                <div>
                    <Link href="/" className="text-3xl font-bold tracking-tight text-foreground">
                        eWP
                    </Link>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
                        {t("footer_tagline")}
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                        {t("footer_shop")}
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <Link href="/products" className="block hover:text-orange-500">{t("footer_all_products")}</Link>
                        <Link href="/products" className="block hover:text-orange-500">{t("footer_categories")}</Link>
                        <Link href="/favorites" className="block hover:text-orange-500">{t("footer_favorites")}</Link>
                        <Link href="/cart" className="block hover:text-orange-500">{t("footer_cart")}</Link>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                        {t("footer_company")}
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <Link href="/about" className="block hover:text-orange-500">{t("footer_about")}</Link>
                        <Link href="/coupons" className="block hover:text-orange-500">{t("footer_coupons")}</Link>
                        <Link href="/profile" className="block hover:text-orange-500">{t("footer_profile")}</Link>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                        {t("footer_legal")}
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <p>{t("footer_quality")}</p>
                        <p>{t("footer_secure")}</p>
                        <p>{t("footer_fast")}</p>
                    </div>
                </div>
            </div>

            <div className="border-t border-border">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                    <p>© {new Date().getFullYear()} eWP. {t("footer_rights")}</p>
                    <p>{t("footer_platform_line")}</p>
                </div>
            </div>
        </footer>
    );
}
