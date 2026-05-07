"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import AddToCartButton from "@/components/cart/AddToCartButton";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import type { HomeFeedSection } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

function relativeAdded(dateString: string) {
    const createdAt = new Date(dateString);
    const now = new Date();
    const diffHours = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / 36e5));

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
}

function categoryGradient(seed: string) {
    const themes = [
        "from-orange-500/25 via-amber-400/10 to-transparent",
        "from-sky-500/25 via-cyan-400/10 to-transparent",
        "from-emerald-500/25 via-lime-400/10 to-transparent",
        "from-rose-500/25 via-fuchsia-400/10 to-transparent",
    ];

    const value = seed
        .split("")
        .reduce((total, character) => total + character.charCodeAt(0), 0);

    return themes[value % themes.length];
}

export default function ProductBannerCarousel({
    section,
    badge,
}: {
    section: HomeFeedSection;
    badge?: string;
}) {
    const [page, setPage] = useState(0);
    const { t } = useLocale();

    if (section.items.length === 0) {
        return null;
    }

    const activeProduct = section.items[page];
    const imageUrl = resolveMediaUrl(activeProduct.image_url);

    function goToPrevious() {
        setPage((currentPage) =>
            currentPage === 0 ? section.items.length - 1 : currentPage - 1
        );
    }

    function goToNext() {
        setPage((currentPage) =>
            currentPage === section.items.length - 1 ? 0 : currentPage + 1
        );
    }

    return (
        <section className="mt-16">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">
                        {t("banner_live")}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-foreground">{section.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        {section.subtitle}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={goToPrevious}
                        className="rounded-full border border-border bg-card p-3 text-foreground transition hover:border-orange-500 hover:text-orange-500"
                        aria-label={t("pagination_previous")}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={goToNext}
                        className="rounded-full border border-border bg-card p-3 text-foreground transition hover:border-orange-500 hover:text-orange-500"
                        aria-label={t("pagination_next")}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <Link
                        href="/products"
                        className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                    >
                        {t("home_shop")}
                    </Link>
                </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-border bg-card p-4 shadow-sm md:p-6">
                <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <Link
                        href={`/products/${activeProduct.uuid}`}
                        className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-muted"
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={activeProduct.title}
                                className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-[1.04] md:h-[420px]"
                            />
                        ) : (
                            <div
                                className={`h-[320px] bg-gradient-to-br ${categoryGradient(
                                    activeProduct.category_slug ?? activeProduct.uuid
                                )} md:h-[420px]`}
                            />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3">
                            <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                                {activeProduct.category_name ?? t("banner_marketplace")}
                            </span>
                            {badge ? (
                                <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                    {badge}
                                </span>
                            ) : null}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                                {t("banner_featured")}
                            </p>
                            <h3 className="mt-2 max-w-xl text-3xl font-bold text-white md:text-4xl">
                                {activeProduct.title}
                            </h3>
                        </div>
                    </Link>

                    <div className="flex flex-col justify-between rounded-[1.75rem] border border-border bg-background p-6">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
                                        {t("banner_slide")} {page + 1}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t("banner_added")} {relativeAdded(activeProduct.created_at)}
                                    </p>
                                </div>
                                <p className="text-3xl font-bold text-foreground">
                                    {currencyFormatter.format(activeProduct.price)}
                                </p>
                            </div>

                            <p className="mt-6 text-base leading-7 text-muted-foreground">
                                {activeProduct.description ||
                                    t("banner_description_fallback")}
                            </p>
                        </div>

                        <div className="mt-8">
                            <div className="flex flex-wrap gap-2">
                                {section.items.map((product, index) => (
                                    <button
                                        key={`${section.title}-${product.uuid}`}
                                        type="button"
                                        onClick={() => setPage(index)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                            index === page
                                                ? "bg-orange-500 text-white"
                                                : "border border-border bg-card text-foreground hover:border-orange-500 hover:text-orange-500"
                                        }`}
                                        aria-label={`Show ${product.title}`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={`/products/${activeProduct.uuid}`}
                                    className="inline-flex items-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                                >
                                    {t("favorites_view_details")}
                                </Link>
                                <AddToCartButton
                                    variantId={activeProduct.default_variant_id}
                                    availableStock={activeProduct.available_stock}
                                    label={t("product_add_to_cart")}
                                    className="border border-border bg-card text-foreground hover:bg-card hover:text-orange-500"
                                />
                                <FavoriteButton productUuid={activeProduct.uuid} />
                                {activeProduct.category_slug ? (
                                    <Link
                                        href={`/category/${activeProduct.category_slug}`}
                                        className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                                    >
                                        {t("banner_more_in")} {activeProduct.category_name}
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
