"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "react-toastify";

import FavoriteButton from "@/components/favorite/FavoriteButton";
import { FAVORITES_UPDATED_EVENT } from "@/components/favorite/favoriteEvents";
import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import { getFavorites } from "@/services/favoriteService";
import type { FavoritesResult } from "@/types/favorite";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

export default function FavoritesPageClient() {
    const router = useRouter();
    const { t } = useLocale();
    const [favorites, setFavorites] = useState<FavoritesResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        async function loadFavorites() {
            try {
                const result = await getFavorites();

                if (!isMounted) {
                    return;
                }

                setFavorites(result);
                setIsAuthenticated(true);
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                const message = error instanceof Error ? error.message : t("favorites_load_failed");
                toast.error(message);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadFavorites();

        function handleFavoritesUpdated() {
            void loadFavorites();
        }

        window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
                <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">{t("favorites_title")}</h1>
                <p className="mt-3 text-muted-foreground">
                    {t("favorites_login_text")}
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="mt-6 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                    {t("common_go_login")}
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-foreground">{t("favorites_title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                {favorites?.count ?? 0} {t("favorites_saved_suffix")}
            </p>

            {favorites?.items.length ? (
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {favorites.items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-border bg-background p-4">
                            <Link href={`/products/${item.product.uuid}`} className="block">
                                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                                    {resolveMediaUrl(item.product.image_url) ? (
                                        <img
                                            src={resolveMediaUrl(item.product.image_url) ?? undefined}
                                            alt={item.product.title}
                                            className="h-52 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-52 items-center justify-center text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                            {item.product.category_name ?? t("products_title")}
                                        </div>
                                    )}
                                </div>
                                <h2 className="mt-4 line-clamp-2 font-semibold text-foreground">
                                    {item.product.title}
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {item.product.category_name ?? "Product"}
                                </p>
                                <p className="mt-2 text-base font-semibold text-foreground">
                                    {currencyFormatter.format(item.product.price)}
                                </p>
                            </Link>

                            <div className="mt-4 flex items-center justify-between gap-3">
                                <Link
                                    href={`/products/${item.product.uuid}`}
                                    className="text-sm font-semibold text-orange-500"
                                >
                                    {t("favorites_view_details")}
                                </Link>
                                <FavoriteButton productUuid={item.product.uuid} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-8 rounded-[1.5rem] border border-dashed border-border bg-background p-8 text-center">
                    <p className="text-muted-foreground">{t("favorites_empty")}</p>
                    <Link
                        href="/products"
                        className="mt-5 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                        {t("favorites_browse")}
                    </Link>
                </div>
            )}
        </div>
    );
}
