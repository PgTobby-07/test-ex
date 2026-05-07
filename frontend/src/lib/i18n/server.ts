import { cookies } from "next/headers";

import { getTranslation, isLocale, type Locale } from "@/lib/i18n/shared";

export async function getServerLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const locale = cookieStore.get("locale")?.value;
    return isLocale(locale) ? locale : "en";
}

export async function getServerTranslator() {
    const locale = await getServerLocale();
    return {
        locale,
        t: (key: string) => getTranslation(locale, key),
    };
}
