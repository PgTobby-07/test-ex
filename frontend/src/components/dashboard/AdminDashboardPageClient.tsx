"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Trash2, UserX } from "lucide-react";
import { toast } from "react-toastify";

import { useLocale } from "@/components/locale/LocaleProvider";
import {
    createAdminCategory,
    deactivateAdminUser,
    deleteAdminCategory,
    deleteAdminProduct,
    deleteAdminUser,
} from "@/services/adminService";
import { resolveMediaUrl } from "@/lib/media";
import { getCurrentUser } from "@/services/authService";
import { getAdminDashboard } from "@/services/dashboardService";
import type { CurrentUser } from "@/types/auth";
import type { AdminDashboard } from "@/types/dashboard";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

export default function AdminDashboardPageClient() {
    const router = useRouter();
    const { t } = useLocale();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busyUserUuid, setBusyUserUuid] = useState<string | null>(null);
    const [busyProductUuid, setBusyProductUuid] = useState<string | null>(null);
    const [busyCategoryId, setBusyCategoryId] = useState<number | null>(null);
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [categorySlug, setCategorySlug] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        async function loadAdminDashboard() {
            try {
                const user = await getCurrentUser();

                if (!isMounted) {
                    return;
                }

                setCurrentUser(user);

                if (user.role !== "admin" && user.role !== "superadmin") {
                    setIsLoading(false);
                    return;
                }

                const data = await getAdminDashboard();

                if (!isMounted) {
                    return;
                }

                setDashboard(data);
                setLoadError(null);
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                const message =
                    error instanceof Error ? error.message : t("admin_load_failed");

                if (
                    message.toLowerCase().includes("invalid token") ||
                    message.toLowerCase().includes("user not found")
                ) {
                    localStorage.removeItem("token");
                    setCurrentUser(null);
                    setDashboard(null);
                } else {
                    setLoadError(message);
                    toast.error(message);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadAdminDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    async function refreshDashboard() {
        const data = await getAdminDashboard();
        setDashboard(data);
    }

    async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSavingCategory(true);
            await createAdminCategory({
                name: categoryName.trim(),
                slug: categorySlug.trim(),
            });
            await refreshDashboard();
            setCategoryName("");
            setCategorySlug("");
            toast.success(t("admin_category_created"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("admin_create_category_failed"));
        } finally {
            setIsSavingCategory(false);
        }
    }

    async function handleDeleteCategory(categoryId: number) {
        try {
            setBusyCategoryId(categoryId);
            await deleteAdminCategory(categoryId);
            await refreshDashboard();
            toast.success(t("admin_category_deleted"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("admin_delete_category_failed"));
        } finally {
            setBusyCategoryId(null);
        }
    }

    async function handleDeleteProduct(productUuid: string) {
        try {
            setBusyProductUuid(productUuid);
            await deleteAdminProduct(productUuid);
            await refreshDashboard();
            toast.success(t("admin_product_deleted"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("admin_delete_product_failed"));
        } finally {
            setBusyProductUuid(null);
        }
    }

    async function handleDeactivateUser(userUuid: string) {
        try {
            setBusyUserUuid(userUuid);
            await deactivateAdminUser(userUuid);
            await refreshDashboard();
            toast.success(t("admin_user_deactivated"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("admin_deactivate_user_failed"));
        } finally {
            setBusyUserUuid(null);
        }
    }

    async function handleDeleteUser(userUuid: string) {
        try {
            setBusyUserUuid(userUuid);
            await deleteAdminUser(userUuid);
            await refreshDashboard();
            toast.success(t("admin_user_deleted"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("admin_delete_user_failed"));
        } finally {
            setBusyUserUuid(null);
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
                <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">Admin dashboard</h1>
                <p className="mt-3 text-muted-foreground">Login first to view the platform overview.</p>
                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="mt-6 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                    Go to login
                </button>
            </div>
        );
    }

    if (currentUser.role !== "admin" && currentUser.role !== "superadmin") {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">Admin dashboard</h1>
                <p className="mt-3 text-muted-foreground">This page is only available for admin accounts.</p>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">Admin dashboard</h1>
                <p className="mt-3 text-muted-foreground">
                    {loadError || t("admin_load_failed")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Admin dashboard</p>
                <h1 className="mt-2 text-3xl font-bold text-foreground">Platform overview</h1>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Users</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.user_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sellers</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.seller_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customers</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.customer_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Products</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.product_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Orders</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.order_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pending orders</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.pending_order_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4 md:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Revenue</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{currencyFormatter.format(dashboard.stats.total_revenue)}</p>
                    </div>
                </div>
            </section>

            <section className="grid gap-8 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground">Recent users</h2>
                    <div className="mt-6 space-y-4">
                        {dashboard.recent_users.map((user) => (
                            <div key={user.uuid} className="rounded-2xl border border-border bg-background p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-semibold text-foreground">
                                            {user.full_name?.trim() || user.email}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-orange-500">{user.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void handleDeactivateUser(user.uuid)}
                                                disabled={busyUserUuid === user.uuid || user.uuid === currentUser.uuid}
                                                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500 disabled:opacity-60"
                                            >
                                                <UserX className="h-3.5 w-3.5" />
                                                Deactivate
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteUser(user.uuid)}
                                                disabled={busyUserUuid === user.uuid || user.uuid === currentUser.uuid}
                                                className="inline-flex items-center gap-2 rounded-full border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-60"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground">Categories</h2>
                    <form onSubmit={handleCreateCategory} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(event) => setCategoryName(event.target.value)}
                            placeholder="Category name"
                            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-orange-500"
                            required
                        />
                        <input
                            type="text"
                            value={categorySlug}
                            onChange={(event) => setCategorySlug(event.target.value)}
                            placeholder="category-slug"
                            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-orange-500"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSavingCategory}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
                        >
                            <Plus className="h-4 w-4" />
                            Add
                        </button>
                    </form>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {dashboard.categories.map((category) => (
                            <div
                                key={category.id}
                                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground"
                            >
                                <Link href={`/category/${category.slug}`} className="hover:text-orange-500">
                                    {category.name}
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => void handleDeleteCategory(category.id)}
                                    disabled={busyCategoryId === category.id}
                                    className="text-red-500 transition hover:text-red-600 disabled:opacity-60"
                                    aria-label={`Delete ${category.name}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground">Recent products</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {dashboard.recent_products.map((product) => (
                        <div key={product.uuid} className="rounded-2xl border border-border bg-background p-4">
                            <Link href={`/products/${product.uuid}`}>
                                <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                                    {resolveMediaUrl(product.image_url) ? (
                                        <img src={resolveMediaUrl(product.image_url) ?? undefined} alt={product.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                            {product.category_name ?? "Product"}
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-4 line-clamp-2 text-base font-semibold text-foreground">{product.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{product.category_name ?? "Category"}</p>
                            </Link>
                            <button
                                type="button"
                                onClick={() => void handleDeleteProduct(product.uuid)}
                                disabled={busyProductUuid === product.uuid}
                                className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-60"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete product
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground">Recent orders</h2>
                <div className="mt-6 space-y-4">
                    {dashboard.recent_orders.map((order) => (
                        <div key={order.uuid} className="rounded-2xl border border-border bg-background p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-base font-semibold text-foreground">Order #{order.uuid.slice(0, 8)}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {order.customer_name?.trim() || order.customer_email || "Customer"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-foreground">{currencyFormatter.format(order.total_amount)}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-orange-500">{order.status}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
