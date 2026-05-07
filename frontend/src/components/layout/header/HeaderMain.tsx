"use client";

import { FormEvent, useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, LogOut, Search, ShoppingCart, Sun, User, Moon } from "lucide-react";
import { toast } from "react-toastify";

import { AUTH_UPDATED_EVENT, notifyAuthUpdated } from "@/components/auth/authEvents";
import { CART_UPDATED_EVENT } from "@/components/cart/cartEvents";
import { FAVORITES_UPDATED_EVENT } from "@/components/favorite/favoriteEvents";
import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import { getCurrentUser } from "@/services/authService";
import { getCart } from "@/services/cartService";
import { getFavorites } from "@/services/favoriteService";
import { getProducts } from "@/services/productService";
import { applyTheme, getInitialTheme, type ThemeMode } from "@/lib/theme";
import type { Product } from "@/types/product";

type HeaderUser = {
    full_name: string | null;
    email: string;
};

export default function HeaderMain() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLocale();
    const [currentUser, setCurrentUser] = useState<HeaderUser | null>(null);
    const [theme, setTheme] = useState<ThemeMode>("light");
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const deferredSearch = useDeferredValue(search);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [favoritesCount, setFavoritesCount] = useState(0);

    useEffect(() => {
        setTheme(getInitialTheme());

        let isMounted = true;

        function isAuthError(error: unknown) {
            const message = error instanceof Error ? error.message.toLowerCase() : "";
            return (
                message.includes("invalid token") ||
                message.includes("not authenticated") ||
                message.includes("user not found")
            );
        }

        async function loadHeaderState() {
            const token = localStorage.getItem("token");

            if (!token) {
                if (!isMounted) {
                    return;
                }

                setCurrentUser(null);
                setCartCount(0);
                setFavoritesCount(0);
                return;
            }

            try {
                const user = await getCurrentUser();

                if (!isMounted) {
                    return;
                }

                setCurrentUser({
                    full_name: user.full_name,
                    email: user.email,
                });

                void getCart()
                    .then((cart) => {
                        if (!isMounted) {
                            return;
                        }

                        setCartCount(cart.items_count);
                    })
                    .catch((error) => {
                        if (!isMounted || isAuthError(error)) {
                            return;
                        }

                        setCartCount(0);
                    });

                void getFavorites()
                    .then((favorites) => {
                        if (!isMounted) {
                            return;
                        }

                        setFavoritesCount(favorites.count);
                    })
                    .catch((error) => {
                        if (!isMounted || isAuthError(error)) {
                            return;
                        }

                        setFavoritesCount(0);
                    });
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                if (isAuthError(error)) {
                    localStorage.removeItem("token");
                    setCurrentUser(null);
                    setCartCount(0);
                    setFavoritesCount(0);
                }
            }
        }

        function handleCartUpdated() {
            void getCart()
                .then((cart) => {
                    if (!isMounted) {
                        return;
                    }

                    setCartCount(cart.items_count);
                })
                .catch((error) => {
                    if (!isMounted || isAuthError(error)) {
                        return;
                    }

                    setCartCount(0);
                });
        }

        function handleFavoritesUpdated() {
            void getFavorites()
                .then((favorites) => {
                    if (!isMounted) {
                        return;
                    }

                    setFavoritesCount(favorites.count);
                })
                .catch((error) => {
                    if (!isMounted || isAuthError(error)) {
                        return;
                    }

                    setFavoritesCount(0);
                });
        }

        function handleAuthUpdated() {
            void loadHeaderState();
        }

        void loadHeaderState();
        window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
        window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
        window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
            window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
            window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);
        };
    }, []);

    useEffect(() => {
        setSearch(searchParams.get("search") ?? "");
    }, [searchParams]);

    const displayName = currentUser
        ? currentUser.full_name?.trim() || currentUser.email.split("@")[0] || t("header_my_account")
        : t("auth_sign_in");

    function handleThemeToggle() {
        const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        setTheme(nextTheme);
    }

    function handleLogout() {
        localStorage.removeItem("token");
        setCurrentUser(null);
        setCartCount(0);
        setFavoritesCount(0);
        notifyAuthUpdated();
        toast.success(t("header_logged_out"));
        router.push("/login");
        router.refresh();
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const query = search.trim();
        setIsSuggestionsOpen(false);

        if (!query) {
            router.push("/products");
            return;
        }

        router.push(`/products?search=${encodeURIComponent(query)}`);
    }

    useEffect(() => {
        const query = deferredSearch.trim();

        if (!query) {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
            setIsSearching(false);
            return;
        }

        let isMounted = true;
        const timeoutId = window.setTimeout(() => {
            setIsSearching(true);

            getProducts({ search: query, limit: 5 })
                .then((result) => {
                    if (!isMounted) {
                        return;
                    }

                    setSuggestions(result.items);
                    setIsSuggestionsOpen(true);
                })
                .catch(() => {
                    if (!isMounted) {
                        return;
                    }

                    setSuggestions([]);
                    setIsSuggestionsOpen(false);
                })
                .finally(() => {
                    if (!isMounted) {
                        return;
                    }

                    setIsSearching(false);
                });
        }, 350);

        return () => {
            isMounted = false;
            window.clearTimeout(timeoutId);
        };
    }, [deferredSearch]);

    return (
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4">
            <Link href="/" className="shrink-0 text-4xl font-bold tracking-tight text-foreground">
                eWP
            </Link>

            <form onSubmit={handleSearchSubmit} className="relative hidden flex-1 md:block">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-500" />

                <input
                    type="text"
                    placeholder={t("header_search_placeholder")}
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setIsSuggestionsOpen(true);
                        }
                    }}
                    onBlur={() => {
                        window.setTimeout(() => setIsSuggestionsOpen(false), 150);
                    }}
                    className="h-12 w-full rounded-xl border border-border bg-muted pl-12 pr-4 text-sm text-foreground outline-none transition focus:border-orange-500 focus:bg-background"
                />

                {isSuggestionsOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                        {isSearching ? (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                                {t("header_searching")}
                            </div>
                        ) : suggestions.length > 0 ? (
                            <>
                                {suggestions.map((product) => (
                                    <Link
                                        key={product.uuid}
                                        href={`/products/${product.uuid}`}
                                        onClick={() => setIsSuggestionsOpen(false)}
                                        className="flex items-center gap-3 border-b border-border px-4 py-3 transition last:border-b-0 hover:bg-muted"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                                            {resolveMediaUrl(product.image_url) ? (
                                                <img
                                                    src={resolveMediaUrl(product.image_url) ?? undefined}
                                                    alt={product.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                                    {product.category_name ?? t("header_item")}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {product.title}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {product.category_name ?? t("header_product")}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">
                                            ${product.price}
                                        </span>
                                    </Link>
                                ))}
                                <button
                                    type="submit"
                                    className="w-full border-t border-border px-4 py-3 text-left text-sm font-semibold text-orange-500 transition hover:bg-muted"
                                >
                                    {t("header_see_all_results")} "{search.trim()}"
                                </button>
                            </>
                        ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                                {t("header_no_matches")}
                            </div>
                        )}
                    </div>
                ) : null}
            </form>

            <nav className="ml-auto flex items-center gap-5 text-sm font-semibold text-foreground/80">
                <Link
                    href={currentUser ? "/profile" : "/login"}
                    className="flex items-center gap-2 hover:text-orange-500"
                >
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline">{displayName}</span>
                </Link>

                <Link href="/favorites" className="flex items-center gap-2 hover:text-orange-500">
                    <span className="relative inline-flex">
                        <Heart className="h-5 w-5" />
                        {currentUser && favoritesCount > 0 ? (
                            <>
                                <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                                <span className="absolute -right-3.5 -top-3.5 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                                    {favoritesCount}
                                </span>
                            </>
                        ) : null}
                    </span>
                    <span className="hidden lg:inline">{t("footer_favorites")}</span>
                </Link>

                <Link href="/cart" className="flex items-center gap-2 hover:text-orange-500">
                    <span className="relative inline-flex">
                        <ShoppingCart className="h-5 w-5" />
                        {currentUser && cartCount > 0 ? (
                            <>
                                <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                                <span className="absolute -right-3.5 -top-3.5 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                                    {cartCount}
                                </span>
                            </>
                        ) : null}
                    </span>
                    <span className="hidden lg:inline">{t("footer_cart")}</span>
                </Link>

                {currentUser ? (
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 hover:text-orange-500"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="hidden lg:inline">{t("header_logout")}</span>
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={handleThemeToggle}
                    className="rounded-full border border-border bg-background p-2 hover:border-orange-500 hover:text-orange-500"
                    aria-label={theme === "dark" ? t("header_switch_light") : t("header_switch_dark")}
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </button>
            </nav>
        </div>
    );
}
