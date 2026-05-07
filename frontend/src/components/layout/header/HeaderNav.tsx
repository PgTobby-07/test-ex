"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/locale/LocaleProvider";

import type { Category } from "@/types/product";

export default function HeaderNav({
    categories,
}: {
    categories: Category[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLocale();

    return (
        <div className="border-t border-border">
            <div className="mx-auto flex min-h-12 max-w-7xl items-center gap-7 overflow-x-auto px-4 text-sm font-semibold text-foreground/80">
                <div className="relative shrink-0">
                    {isOpen ? (
                        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-3 shadow-xl">
                            <Link
                                href="/products"
                                onClick={() => setIsOpen(false)}
                                className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted hover:text-orange-500"
                            >
                                {t("nav_all_categories")}
                            </Link>
                            
                            <div className="mt-2 border-t border-border pt-2">
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.slug}`}
                                        onClick={() => setIsOpen(false)}
                                        className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted hover:text-orange-500"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                <Link href="/products" className="shrink-0 py-3 hover:text-orange-500">
                    {t("nav_all_categories")}
                </Link>

                {categories.map((category) => (
                    <Link
                        key={`nav-${category.id}`}
                        href={`/category/${category.slug}`}
                        className="relative shrink-0 py-3 hover:text-orange-500"
                    >
                        {category.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}
