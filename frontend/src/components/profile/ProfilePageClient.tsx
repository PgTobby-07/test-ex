"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUp, LoaderCircle, PencilLine, Save } from "lucide-react";
import { toast } from "react-toastify";

import { notifyAuthUpdated } from "@/components/auth/authEvents";
import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import { getCart } from "@/services/cartService";
import { getFavorites } from "@/services/favoriteService";
import { getOrders } from "@/services/orderService";
import { getCurrentUser, updateCurrentUser, uploadCurrentUserAvatar } from "@/services/authService";
import type { CurrentUser } from "@/types/auth";
import type { Order } from "@/types/order";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

export default function ProfilePageClient() {
    const router = useRouter();
    const { t } = useLocale();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [cartCount, setCartCount] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        setIsAuthenticated(true);

        let isMounted = true;

        async function loadProfile() {
            try {
                const [currentUser, favorites, cart, userOrders] = await Promise.all([
                    getCurrentUser(),
                    getFavorites(),
                    getCart(),
                    getOrders(),
                ]);

                if (!isMounted) {
                    return;
                }

                setUser(currentUser);
                setOrders(userOrders);
                setFavoritesCount(favorites.count);
                setCartCount(cart.items_count);
                setFullName(currentUser.full_name ?? "");
                setPhone(currentUser.phone ?? "");
                setAvatarUrl(currentUser.avatar_url ?? "");
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                const message = error instanceof Error ? error.message : t("profile_load_failed");

                if (message.toLowerCase().includes("invalid token") || message.toLowerCase().includes("user not found")) {
                    localStorage.removeItem("token");
                    setIsAuthenticated(false);
                    setUser(null);
                    setOrders([]);
                    return;
                }

                toast.error(message);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    const totalSpent = useMemo(
        () => orders.reduce((sum, order) => sum + order.total_amount, 0),
        [orders]
    );

    const recentOrders = orders.slice(0, 5);
    const avatarImageUrl = resolveMediaUrl(avatarUrl);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSaving(true);
            const updatedUser = await updateCurrentUser({
                full_name: fullName,
                phone,
            });
            setUser(updatedUser);
            notifyAuthUpdated();
            toast.success(t("profile_updated"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("profile_update_failed"));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            setIsUploadingAvatar(true);
            const updatedUser = await uploadCurrentUserAvatar(file);
            setUser(updatedUser);
            setAvatarUrl(updatedUser.avatar_url ?? "");
            notifyAuthUpdated();
            toast.success(t("profile_avatar_updated"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("profile_avatar_failed"));
        } finally {
            setIsUploadingAvatar(false);
            event.target.value = "";
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
                <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">{t("profile_title")}</h1>
                <p className="mt-3 text-muted-foreground">
                    {t("profile_login_text")}
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
        <div className="space-y-8">
            <section className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-2xl font-bold text-foreground">
                            {avatarImageUrl ? (
                                <img src={avatarImageUrl} alt={user.full_name ?? user.email} className="h-full w-full object-cover" />
                            ) : (
                                (user.full_name?.trim()?.[0] ?? user.email[0]).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                {user.full_name?.trim() || user.email}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                            <p className="mt-2 inline-flex rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                                {user.role}
                            </p>
                        </div>
                    </div>

                    <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500">
                        <ImageUp className="h-4 w-4" />
                        {isUploadingAvatar ? t("common_uploading") : t("profile_upload_avatar")}
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={isUploadingAvatar}
                        />
                    </label>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cart Items</p>
                            <p className="mt-2 text-2xl font-bold text-foreground">{cartCount}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Favorites</p>
                            <p className="mt-2 text-2xl font-bold text-foreground">{favoritesCount}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Orders</p>
                            <p className="mt-2 text-2xl font-bold text-foreground">{orders.length}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total Spent</p>
                            <p className="mt-2 text-2xl font-bold text-foreground">{currencyFormatter.format(totalSpent)}</p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3 text-sm text-muted-foreground">
                        <p><span className="font-semibold text-foreground">Phone:</span> {user.phone || "Not added"}</p>
                        <p><span className="font-semibold text-foreground">Status:</span> {user.is_active ? "Active" : "Inactive"}</p>
                        <p><span className="font-semibold text-foreground">Account:</span> {user.is_banned ? "Banned" : "Good standing"}</p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/orders" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500">
                            Orders
                        </Link>
                        <Link href="/favorites" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500">
                            Favorites
                        </Link>
                        <Link href="/cart" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500">
                            Cart
                        </Link>
                        {user.role === "seller" ? (
                            <Link href="/seller/dashboard" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500">
                                Seller dashboard
                            </Link>
                        ) : null}
                        {user.role === "admin" || user.role === "superadmin" ? (
                            <Link href="/admin/dashboard" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500">
                                Admin dashboard
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-8">
                    <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <PencilLine className="h-5 w-5 text-orange-500" />
                            <h2 className="text-2xl font-bold text-foreground">Edit profile</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="text-sm font-medium text-foreground">
                                Full name
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                />
                            </label>

                            <label className="text-sm font-medium text-foreground">
                                Phone
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                />
                            </label>

                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <Save className="h-4 w-4" />
                                    {isSaving ? "Saving..." : "Save profile"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-foreground">Recent orders</h2>

                        {recentOrders.length > 0 ? (
                            <div className="mt-6 space-y-4">
                                {recentOrders.map((order) => (
                                    <div key={order.uuid} className="rounded-2xl border border-border bg-background p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">#{order.uuid.slice(0, 8)}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {currencyFormatter.format(order.total_amount)}
                                                </p>
                                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-orange-500">
                                                    {order.status}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            {order.items.length} item{order.items.length === 1 ? "" : "s"} • payment {order.payment_status}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-6 text-muted-foreground">
                                No orders yet.
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </div>
    );
}
