 "use client";

import Link from "next/link";

import { useLocale } from "@/components/locale/LocaleProvider";

export default function HeaderTopLinks() {
    const { locale, setLocale, t } = useLocale();

    return (
        <div className="hidden border-b border-border bg-muted/60 md:block">
            <div className="mx-auto flex h-9 max-w-7xl items-center justify-end gap-8 px-4 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>{t("language")}:</span>
                    {(["en", "tr", "ar"] as const).map((code) => (
                        <button
                            key={code}
                            type="button"
                            onClick={() => setLocale(code)}
                            className={locale === code ? "font-semibold text-orange-500" : "hover:text-orange-500"}
                        >
                            {code.toUpperCase()}
                        </button>
                    ))}
                </div>
                <Link href="/about" className="hover:text-orange-500">{t("about")}</Link>
                <Link href="/coupons" className="hover:text-orange-500">{t("coupons")}</Link>
            </div>
        </div>
    );
}
