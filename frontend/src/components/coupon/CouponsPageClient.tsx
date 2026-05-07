"use client";

import { useEffect, useState } from "react";
import { Copy, LoaderCircle } from "lucide-react";
import { toast } from "react-toastify";

import { useLocale } from "@/components/locale/LocaleProvider";
import { getCoupons } from "@/services/couponService";
import type { Coupon } from "@/types/coupon";

export default function CouponsPageClient() {
    const { t } = useLocale();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        void getCoupons()
            .then((result) => setCoupons(result))
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : t("coupons_empty"));
            })
            .finally(() => setIsLoading(false));
    }, []);

    async function handleCopy(code: string) {
        await navigator.clipboard.writeText(code);
        toast.success(t("coupons_copy"));
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
                <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="rounded-[2.5rem] border border-border bg-card p-10 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">{t("coupons")}</p>
                <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">{t("coupons_title")}</h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">{t("coupons_subtitle")}</p>
            </section>

            {coupons.length > 0 ? (
                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {coupons.map((coupon) => (
                        <div key={coupon.code} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                                {coupon.discount_percent}% OFF
                            </p>
                            <h2 className="mt-3 text-2xl font-bold text-foreground">{coupon.title}</h2>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                {coupon.description}
                            </p>
                            <div className="mt-6 rounded-2xl border border-dashed border-orange-500/50 bg-orange-500/5 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {t("coupons_copy")}
                                </p>
                                <p className="mt-2 text-xl font-bold text-foreground">{coupon.code}</p>
                            </div>
                            <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                <span>{t("coupons_expires")}</span>
                                <span>{new Date(coupon.ends_at).toLocaleString()}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => void handleCopy(coupon.code)}
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                            >
                                <Copy className="h-4 w-4" />
                                {t("coupons_copy")}
                            </button>
                        </div>
                    ))}
                </section>
            ) : (
                <div className="rounded-[2rem] border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                    {t("coupons_empty")}
                </div>
            )}
        </div>
    );
}
