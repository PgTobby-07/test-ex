"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { notifyCartUpdated } from "@/components/cart/cartEvents";
import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import { applyCartCoupon, getCart, removeCartCoupon, removeCartItem, updateCartItem } from "@/services/cartService";
import { createCheckoutPaymentIntent } from "@/services/orderService";
import type { Cart } from "@/types/cart";

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

export default function CartPageClient() {
    const router = useRouter();
    const { t } = useLocale();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [busyVariantId, setBusyVariantId] = useState<number | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    async function loadCart() {
        try {
            const nextCart = await getCart();
            setCart(nextCart);
        } catch (error) {
            const message = error instanceof Error ? error.message : t("cart_load_failed");

            if (message.toLowerCase().includes("not authenticated")) {
                localStorage.removeItem("token");
                setIsAuthenticated(false);
                setCart(null);
                return;
            }

            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        setIsAuthenticated(true);
        void loadCart();
    }, []);

    const isEmpty = useMemo(() => (cart?.items.length ?? 0) === 0, [cart]);

    async function handleApplyCoupon(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!couponCode.trim()) {
            return;
        }

        try {
            setIsApplyingCoupon(true);
            const updatedCart = await applyCartCoupon(couponCode.trim());
            setCart(updatedCart);
            notifyCartUpdated();
            toast.success(t("cart_coupon_applied"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("cart_coupon_apply_failed"));
        } finally {
            setIsApplyingCoupon(false);
        }
    }

    async function handleRemoveCoupon() {
        try {
            setIsApplyingCoupon(true);
            const updatedCart = await removeCartCoupon();
            setCart(updatedCart);
            setCouponCode("");
            notifyCartUpdated();
            toast.success(t("cart_coupon_removed"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("cart_coupon_remove_failed"));
        } finally {
            setIsApplyingCoupon(false);
        }
    }

    async function handleQuantityChange(variantId: number, quantity: number) {
        try {
            setBusyVariantId(variantId);
            await updateCartItem(variantId, quantity);
            await loadCart();
            notifyCartUpdated();
        } catch (error) {
            const message = error instanceof Error ? error.message : t("cart_update_failed");
            toast.error(message);
        } finally {
            setBusyVariantId(null);
        }
    }

    async function handleRemove(variantId: number) {
        try {
            setBusyVariantId(variantId);
            await removeCartItem(variantId);
            await loadCart();
            notifyCartUpdated();
            toast.success(t("cart_item_removed"));
        } catch (error) {
            const message = error instanceof Error ? error.message : t("cart_remove_failed");
            toast.error(message);
        } finally {
            setBusyVariantId(null);
        }
    }

    async function handleCheckout() {
        try {
            setIsCheckingOut(true);
            const paymentIntent = await createCheckoutPaymentIntent();

            router.push(
                `/checkout?order_uuid=${encodeURIComponent(paymentIntent.order_uuid)}&client_secret=${encodeURIComponent(paymentIntent.client_secret)}&amount=${encodeURIComponent(String(paymentIntent.amount))}`
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : t("cart_checkout_failed");
            toast.error(message);
        } finally {
            setIsCheckingOut(false);
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
                <h1 className="text-3xl font-bold text-foreground">{t("cart_title")}</h1>
                <p className="mt-3 text-muted-foreground">
                    {t("cart_login_text")}
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section>
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h1 className="text-3xl font-bold text-foreground">{t("cart_title")}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {cart?.items_count ?? 0} {t("cart_count_suffix")}
                    </p>

                    {isEmpty ? (
                        <div className="mt-8 rounded-[1.5rem] border border-dashed border-border bg-background p-8 text-center">
                            <p className="text-muted-foreground">{t("cart_empty")}</p>
                            <Link
                                href="/products"
                                className="mt-5 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                            >
                                {t("cart_browse")}
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-8 space-y-4">
                            {cart?.items.map((item) => {
                                const attributeLabels = getAttributeLabels(item.attributes);

                                return (
                                <div
                                    key={item.id}
                                    className="grid gap-4 rounded-[1.5rem] border border-border bg-background p-4 md:grid-cols-[120px_minmax(0,1fr)_120px]"
                                >
                                    <Link
                                        href={item.product_uuid ? `/products/${item.product_uuid}` : "/products"}
                                        className="overflow-hidden rounded-2xl border border-border bg-muted"
                                    >
                                        {resolveMediaUrl(item.product_image_url) ? (
                                            <img
                                                src={resolveMediaUrl(item.product_image_url) ?? undefined}
                                                alt={item.product_title ?? "Product"}
                                                className="h-28 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-28 items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                                Product
                                            </div>
                                        )}
                                    </Link>

                                    <div className="min-w-0">
                                        <Link
                                            href={item.product_uuid ? `/products/${item.product_uuid}` : "/products"}
                                            className="line-clamp-2 text-lg font-semibold text-foreground"
                                        >
                                            {item.product_title ?? "Product"}
                                        </Link>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.category_name ?? "Category"}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            {attributeLabels.map((label) => (
                                                <span key={label} className="rounded-full bg-card px-3 py-1">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start gap-3 md:items-end">
                                        <p className="text-lg font-semibold text-foreground">
                                            {currencyFormatter.format(item.line_total)}
                                        </p>
                                        <label className="text-sm text-muted-foreground">
                                            Qty
                                            <input
                                                type="number"
                                                min={1}
                                                max={Math.max(item.stock, 1)}
                                                value={item.quantity}
                                                disabled={busyVariantId === item.variant_id}
                                                onChange={(event) => {
                                                    void handleQuantityChange(
                                                        item.variant_id,
                                                        Math.max(1, Number(event.target.value) || 1)
                                                    );
                                                }}
                                                className="mt-1 block w-20 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-orange-500"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => void handleRemove(item.variant_id)}
                                            disabled={busyVariantId === item.variant_id}
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 transition hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <aside className="h-fit rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28">
                <h2 className="text-xl font-bold text-foreground">Summary</h2>
                <form onSubmit={handleApplyCoupon} className="mt-6 space-y-3">
                    <p className="text-sm font-semibold text-foreground">{t("cart_coupon_title")}</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                            placeholder={t("cart_coupon_placeholder")}
                            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-orange-500"
                        />
                        <button
                            type="submit"
                            disabled={isApplyingCoupon}
                            className="rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
                        >
                            {t("cart_coupon_apply")}
                        </button>
                    </div>
                    {cart?.applied_coupon_code ? (
                        <button
                            type="button"
                            onClick={() => void handleRemoveCoupon()}
                            disabled={isApplyingCoupon}
                            className="text-sm font-semibold text-orange-500"
                        >
                            {cart.applied_coupon_code} · {t("cart_coupon_remove")}
                        </button>
                    ) : null}
                </form>
                <div className="mt-6 space-y-4 text-sm text-foreground">
                    <div className="flex items-center justify-between">
                        <span>Items</span>
                        <span>{cart?.items_count ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold">
                            {currencyFormatter.format(cart?.subtotal ?? 0)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>{t("cart_discount")}</span>
                        <span className="font-semibold text-orange-500">
                            -{currencyFormatter.format(cart?.discount_amount ?? 0)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-4 text-base">
                        <span>{t("cart_total")}</span>
                        <span className="font-bold">
                            {currencyFormatter.format(cart?.total_after_discount ?? 0)}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void handleCheckout()}
                    disabled={isEmpty || isCheckingOut}
                    className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
                        isEmpty
                            ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                >
                    {isCheckingOut ? "Starting checkout..." : "Proceed to payment"}
                </button>
            </aside>
        </div>
    );
}
