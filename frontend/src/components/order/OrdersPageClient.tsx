"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import { confirmOrder, deleteOrder, getOrders } from "@/services/orderService";
import type { Order } from "@/types/order";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

function getAttributeLabels(attributes: { key: string; value: string }[]) {
    return attributes
        .filter((attribute) => attribute.key && attribute.value)
        .map((attribute) => `${attribute.key}: ${attribute.value}`);
}

export default function OrdersPageClient() {
    const router = useRouter();
    const { t } = useLocale();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [busyOrderUuid, setBusyOrderUuid] = useState<string | null>(null);

    async function loadOrders() {
        const result = await getOrders();
        setOrders(result);
    }

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        setIsAuthenticated(true);

        let isMounted = true;

        void loadOrders()
            .catch((error) => {
                if (!isMounted) {
                    return;
                }

                const message = error instanceof Error ? error.message : t("orders_load_failed");

                if (message.toLowerCase().includes("invalid token") || message.toLowerCase().includes("user not found")) {
                    localStorage.removeItem("token");
                    setIsAuthenticated(false);
                    setOrders([]);
                    return;
                }

                toast.error(message);
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const totalSpent = useMemo(
        () => orders.reduce((sum, order) => sum + order.total_amount, 0),
        [orders]
    );

    async function handleConfirm(orderUuid: string) {
        try {
            setBusyOrderUuid(orderUuid);
            const updatedOrder = await confirmOrder(orderUuid);
            setOrders((currentOrders) =>
                currentOrders.map((order) => (order.uuid === orderUuid ? updatedOrder : order))
            );
            toast.success(t("orders_confirmed"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("orders_confirm_failed"));
        } finally {
            setBusyOrderUuid(null);
        }
    }

    async function handleDelete(orderUuid: string) {
        try {
            setBusyOrderUuid(orderUuid);
            await deleteOrder(orderUuid);
            setOrders((currentOrders) => currentOrders.filter((order) => order.uuid !== orderUuid));
            toast.success(t("orders_deleted"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("orders_delete_failed"));
        } finally {
            setBusyOrderUuid(null);
        }
    }

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
                <h1 className="text-3xl font-bold text-foreground">{t("orders_title")}</h1>
                <p className="mt-3 text-muted-foreground">
                    {t("orders_login_text")}
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
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t("orders_title")}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {orders.length} order{orders.length === 1 ? "" : "s"} • {currencyFormatter.format(totalSpent)} total
                    </p>
                </div>
            </div>

            {orders.length > 0 ? (
                <div className="mt-8 space-y-4">
                    {orders.map((order) => (
                        <div key={order.uuid} className="rounded-2xl border border-border bg-background p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-base font-semibold text-foreground">
                                        Order #{order.uuid.slice(0, 8)}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-foreground">
                                        {currencyFormatter.format(order.total_amount)}
                                    </p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-orange-500">
                                        {order.status}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                                {order.items.length} item{order.items.length === 1 ? "" : "s"} • payment {order.payment_status}
                            </p>
                            {order.items.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                    {order.items.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={item.product_uuid ? `/products/${item.product_uuid}` : "/products"}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                                        >
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                                                {resolveMediaUrl(item.product_image_url) ? (
                                                    <img
                                                        src={resolveMediaUrl(item.product_image_url) ?? undefined}
                                                        alt={item.product_title ?? "Product"}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                        {item.category_name ?? "Item"}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {item.product_title ?? "Product"}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {item.category_name ?? "Category"} • Qty {item.quantity}
                                                </p>
                                                {item.attributes.length > 0 ? (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                                        {getAttributeLabels(item.attributes).map((label) => (
                                                            <span key={label} className="rounded-full bg-background px-2 py-1">
                                                                {label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {currencyFormatter.format(item.price * item.quantity)}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                            {order.status === "pending" ? (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void handleConfirm(order.uuid)}
                                        disabled={busyOrderUuid === order.uuid}
                                        className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {t("orders_confirm")}
                                    </button>
                                    {order.payment_status !== "paid" ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(order.uuid)}
                                            disabled={busyOrderUuid === order.uuid}
                                            className="inline-flex items-center gap-2 rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-70"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {t("orders_delete")}
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-border bg-background p-6 text-muted-foreground">
                    {t("orders_empty")}
                </div>
            )}
        </div>
    );
}
