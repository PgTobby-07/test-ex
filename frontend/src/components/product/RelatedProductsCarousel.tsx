"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useLocale } from "@/components/locale/LocaleProvider";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

export default function RelatedProductsCarousel({
    products,
    categoryName,
    categorySlug,
}: {
    products: Product[];
    categoryName?: string | null;
    categorySlug?: string | null;
}) {
    const [page, setPage] = useState(0);
    const { t } = useLocale();

    if (products.length === 0) {
        return null;
    }

    const activeProduct = products[page];

    function goToPrevious() {
        setPage((currentPage) =>
            currentPage === 0 ? products.length - 1 : currentPage - 1
        );
    }

    function goToNext() {
        setPage((currentPage) =>
            currentPage === products.length - 1 ? 0 : currentPage + 1
        );
    }

    return (
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
                        {t("related_items")}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-foreground">
                        {t("related_more_from")} {categoryName ?? t("related_this_category")}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={goToPrevious}
                        className="rounded-full border border-border bg-background p-3 text-foreground transition hover:border-orange-500 hover:text-orange-500"
                        aria-label={t("related_prev")}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={goToNext}
                        className="rounded-full border border-border bg-background p-3 text-foreground transition hover:border-orange-500 hover:text-orange-500"
                        aria-label={t("related_next")}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <Link
                        href={categorySlug ? `/category/${categorySlug}` : "/products"}
                        className="text-sm font-semibold text-orange-500"
                    >
                        {t("related_see_category")}
                    </Link>
                </div>
            </div>

            <div className="mt-6">
                <ProductCard product={activeProduct} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                {products.map((item, index) => (
                    <button
                        key={item.uuid}
                        type="button"
                        onClick={() => setPage(index)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            index === page
                                ? "bg-orange-500 text-white"
                                : "border border-border bg-background text-foreground hover:border-orange-500 hover:text-orange-500"
                        }`}
                        aria-label={`Show related product ${item.title}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
