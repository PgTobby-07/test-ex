"use client";

import { useLocale } from "@/components/locale/LocaleProvider";

export default function AboutPageClient() {
    const { t } = useLocale();

    return (
        <div className="space-y-8">
            <section className="rounded-[2.5rem] border border-border bg-card p-10 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">eWP</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-bold text-foreground md:text-5xl">
                    {t("about_title")}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
                    {t("about_subtitle")}
                </p>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground">{t("about_block_1")}</h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("about_text_1")}</p>
                </div>
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground">{t("about_block_2")}</h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("about_text_2")}</p>
                </div>
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground">{t("about_block_3")}</h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("about_text_3")}</p>
                </div>
            </section>
        </div>
    );
}
