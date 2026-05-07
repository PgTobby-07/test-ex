"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslation, isLocale, type Locale } from "@/lib/i18n";

type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    dir: "ltr" | "rtl";
    t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [locale, setLocaleState] = useState<Locale>("en");

    useEffect(() => {
        const storedLocale = window.localStorage.getItem("locale") as Locale | null;
        if (isLocale(storedLocale)) {
            setLocaleState(storedLocale);
        }
    }, []);

    useEffect(() => {
        const dir = locale === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
        window.localStorage.setItem("locale", locale);
        document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    }, [locale]);

    const value = useMemo<LocaleContextValue>(
        () => ({
            locale,
            setLocale: (nextLocale) => {
                if (nextLocale === locale) {
                    return;
                }

                const dir = nextLocale === "ar" ? "rtl" : "ltr";
                document.documentElement.lang = nextLocale;
                document.documentElement.dir = dir;
                window.localStorage.setItem("locale", nextLocale);
                document.cookie = `locale=${nextLocale}; path=/; max-age=31536000`;
                setLocaleState(nextLocale);
                router.refresh();
            },
            dir: locale === "ar" ? "rtl" : "ltr",
            t: (key) => getTranslation(locale, key),
        }),
        [locale, router]
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error("useLocale must be used within LocaleProvider");
    }
    return context;
}
