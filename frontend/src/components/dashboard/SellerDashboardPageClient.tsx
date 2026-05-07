"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import { getCurrentUser } from "@/services/authService";
import { getSellerDashboard } from "@/services/dashboardService";
import { confirmOrder } from "@/services/orderService";
import { createProduct, updateProduct, uploadProductImage } from "@/services/productService";
import type { CurrentUser } from "@/types/auth";
import type { SellerDashboard } from "@/types/dashboard";
import type { Product, ProductVariantAttribute, ProductVariantInput } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

function createEmptyAttribute(): ProductVariantAttribute {
    return {
        key: "",
        value: "",
    };
}

function createEmptyVariant(): ProductVariantInput {
    return {
        attributes: [createEmptyAttribute()],
        price: null,
        stock: 0,
    };
}

function getAttributeLabels(attributes: ProductVariantAttribute[]) {
    return attributes
        .filter((attribute) => attribute.key && attribute.value)
        .map((attribute) => `${attribute.key}: ${attribute.value}`);
}

export default function SellerDashboardPageClient() {
    const router = useRouter();
    const { t } = useLocale();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [busyOrderUuid, setBusyOrderUuid] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [variants, setVariants] = useState<ProductVariantInput[]>([createEmptyVariant()]);
    const [editingProductUuid, setEditingProductUuid] = useState<string | null>(null);

    async function loadDashboard() {
        const [user, nextDashboard] = await Promise.all([getCurrentUser(), getSellerDashboard()]);
        setCurrentUser(user);
        setDashboard(nextDashboard);
    }

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        void loadDashboard()
            .catch((error) => {
                if (!isMounted) {
                    return;
                }

                toast.error(error instanceof Error ? error.message : t("seller_load_failed"));
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

    const cleanVariants = useMemo(
        () =>
            variants
                .map((variant) => ({
                    attributes: variant.attributes
                        .map((attribute) => ({
                            key: attribute.key.trim(),
                            value: attribute.value.trim(),
                        }))
                        .filter((attribute) => attribute.key && attribute.value),
                    price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
                    stock: Number(variant.stock) || 0,
                }))
                .filter(
                    (variant) =>
                        variant.attributes.length > 0 ||
                        variant.price !== null ||
                        variant.stock > 0
                ),
        [variants]
    );

    const isEditing = editingProductUuid !== null;

    function resetProductForm() {
        setTitle("");
        setDescription("");
        setPrice("");
        setCategoryId("");
        setImageFile(null);
        setVariants([createEmptyVariant()]);
        setEditingProductUuid(null);
    }

    function startEditingProduct(product: Product) {
        setEditingProductUuid(product.uuid);
        setTitle(product.title);
        setDescription(product.description ?? "");
        setPrice(String(product.price));
        setCategoryId(String(product.category_id));
        setImageFile(null);
        setVariants(
            product.variants.length > 0
                ? product.variants.map((variant) => ({
                      attributes:
                          variant.attributes.length > 0
                              ? variant.attributes.map((attribute) => ({ ...attribute }))
                              : [createEmptyAttribute()],
                      price: variant.price,
                      stock: variant.stock,
                  }))
                : [createEmptyVariant()]
        );
    }

    function updateVariant(index: number, patch: Partial<ProductVariantInput>) {
        setVariants((currentVariants) =>
            currentVariants.map((variant, currentIndex) =>
                currentIndex === index ? { ...variant, ...patch } : variant
            )
        );
    }

    function addVariant() {
        setVariants((currentVariants) => [...currentVariants, createEmptyVariant()]);
    }

    function updateVariantAttribute(
        variantIndex: number,
        attributeIndex: number,
        patch: Partial<ProductVariantAttribute>
    ) {
        setVariants((currentVariants) =>
            currentVariants.map((variant, currentVariantIndex) => {
                if (currentVariantIndex !== variantIndex) {
                    return variant;
                }

                return {
                    ...variant,
                    attributes: variant.attributes.map((attribute, currentAttributeIndex) =>
                        currentAttributeIndex === attributeIndex
                            ? { ...attribute, ...patch }
                            : attribute
                    ),
                };
            })
        );
    }

    function addVariantAttribute(variantIndex: number) {
        setVariants((currentVariants) =>
            currentVariants.map((variant, currentVariantIndex) =>
                currentVariantIndex === variantIndex
                    ? { ...variant, attributes: [...variant.attributes, createEmptyAttribute()] }
                    : variant
            )
        );
    }

    function removeVariantAttribute(variantIndex: number, attributeIndex: number) {
        setVariants((currentVariants) =>
            currentVariants.map((variant, currentVariantIndex) => {
                if (currentVariantIndex !== variantIndex) {
                    return variant;
                }

                return {
                    ...variant,
                    attributes:
                        variant.attributes.length === 1
                            ? [createEmptyAttribute()]
                            : variant.attributes.filter((_, currentAttributeIndex) => currentAttributeIndex !== attributeIndex),
                };
            })
        );
    }

    function removeVariant(index: number) {
        setVariants((currentVariants) =>
            currentVariants.length === 1
                ? [createEmptyVariant()]
                : currentVariants.filter((_, currentIndex) => currentIndex !== index)
        );
    }

    async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!categoryId) {
            toast.error("Choose a category.");
            return;
        }

        if (!isEditing && cleanVariants.length === 0) {
            toast.error("Add at least one variant.");
            return;
        }

        try {
            setIsSaving(true);
            const product = isEditing && editingProductUuid
                ? await updateProduct(editingProductUuid, {
                      title,
                      description: description || null,
                      price: Number(price),
                      category_id: Number(categoryId),
                  })
                : await createProduct({
                      title,
                      description: description || null,
                      price: Number(price),
                      category_id: Number(categoryId),
                      variants: cleanVariants,
                  });

            if (imageFile) {
                await uploadProductImage(product.uuid, imageFile);
            }

            await loadDashboard();
            resetProductForm();
            toast.success(isEditing ? "Product updated." : t("seller_product_created"));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : isEditing
                      ? "Could not update product."
                      : t("seller_create_product_failed")
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleConfirmOrder(orderUuid: string) {
        try {
            setBusyOrderUuid(orderUuid);
            await confirmOrder(orderUuid);
            await loadDashboard();
            toast.success(t("orders_confirmed"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("orders_confirm_failed"));
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

    if (!currentUser) {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">Seller dashboard</h1>
                <p className="mt-3 text-muted-foreground">Login first to manage your products and orders.</p>
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

    if (currentUser.role !== "seller" && currentUser.role !== "admin" && currentUser.role !== "superadmin") {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">Seller dashboard</h1>
                <p className="mt-3 text-muted-foreground">This page is only available for seller accounts.</p>
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Seller dashboard</p>
                        <h1 className="mt-2 text-3xl font-bold text-foreground">Manage your catalog and customers</h1>
                    </div>
                    <Link href="/products" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500">
                        View storefront
                    </Link>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Products</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.product_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Orders</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.order_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pending</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.pending_order_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customers</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{dashboard.stats.customer_count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Revenue</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{currencyFormatter.format(dashboard.stats.total_revenue)}</p>
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-foreground">{isEditing ? "Edit product" : "Add product"}</h2>
                    {isEditing ? (
                        <button
                            type="button"
                            onClick={resetProductForm}
                            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                        >
                            <X className="h-4 w-4" />
                            Cancel edit
                        </button>
                    ) : null}
                </div>
                <form onSubmit={handleSubmitProduct} className="mt-6 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-foreground">
                            Title
                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                required
                            />
                        </label>
                        <label className="text-sm font-medium text-foreground">
                            Base price
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                required
                            />
                        </label>
                    </div>

                    <label className="text-sm font-medium text-foreground">
                        Description
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            className="mt-2 min-h-32 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                        />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-foreground">
                            Category
                            <select
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                required
                            >
                                <option value="">Choose category</option>
                                {dashboard.categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-sm font-medium text-foreground">
                            Product image
                            <input
                                type="file"
                                accept="image/*,.heic,.heif,.avif,.svg"
                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                    setImageFile(event.target.files?.[0] ?? null);
                                }}
                                className="mt-2 block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                            />
                        </label>
                    </div>

                    {!isEditing ? (
                    <div className="rounded-2xl border border-border bg-background p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-foreground">Variants</h3>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                            >
                                <Plus className="h-4 w-4" />
                                Add variant
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {variants.map((variant, index) => (
                                <div key={`variant-${index}`} className="rounded-2xl border border-border bg-card p-4">
                                    <div className="rounded-2xl border border-dashed border-border bg-background p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    Variant {index + 1}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    SKU is generated automatically when the product is saved.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => addVariantAttribute(index)}
                                                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add attribute
                                            </button>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {variant.attributes.map((attribute, attributeIndex) => (
                                                <div
                                                    key={`variant-${index}-attribute-${attributeIndex}`}
                                                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                                                >
                                                    <label className="text-sm font-medium text-foreground">
                                                        Attribute
                                                        <input
                                                            type="text"
                                                            value={attribute.key}
                                                            onChange={(event) =>
                                                                updateVariantAttribute(index, attributeIndex, {
                                                                    key: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Storage, Color, Material, RAM"
                                                            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                                        />
                                                    </label>
                                                    <label className="text-sm font-medium text-foreground">
                                                        Value
                                                        <input
                                                            type="text"
                                                            value={attribute.value}
                                                            onChange={(event) =>
                                                                updateVariantAttribute(index, attributeIndex, {
                                                                    value: event.target.value,
                                                                })
                                                            }
                                                            placeholder="128GB, Black, Cotton"
                                                            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                                        />
                                                    </label>
                                                    <div className="flex items-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariantAttribute(index, attributeIndex)}
                                                            className="inline-flex items-center gap-2 rounded-full px-3 py-3 text-sm font-semibold text-red-500 transition hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Variant price
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={variant.price ?? ""}
                                                onChange={(event) =>
                                                    updateVariant(index, {
                                                        price: event.target.value ? Number(event.target.value) : null,
                                                    })
                                                }
                                                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                            />
                                        </label>
                                        <label className="text-sm font-medium text-foreground">
                                            Stock
                                            <input
                                                type="number"
                                                min="0"
                                                value={variant.stock}
                                                onChange={(event) =>
                                                    updateVariant(index, { stock: Number(event.target.value) || 0 })
                                                }
                                                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-orange-500"
                                            />
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-500 transition hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove variant
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    ) : (
                        <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground">
                            Variant editing stays unchanged for now. This form updates the product details and image.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
                    >
                        {isSaving ? "Saving..." : isEditing ? "Update product" : "Create product"}
                    </button>
                </form>
            </section>

            <section className="grid gap-8 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground">Your products</h2>
                    <div className="mt-6 space-y-4">
                        {dashboard.products.length > 0 ? (
                            dashboard.products.map((product) => (
                                <div key={product.uuid} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                                        {resolveMediaUrl(product.image_url) ? (
                                            <img src={resolveMediaUrl(product.image_url) ?? undefined} alt={product.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                {product.category_name ?? "Product"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/products/${product.uuid}`} className="truncate text-base font-semibold text-foreground">
                                            {product.title}
                                        </Link>
                                        <p className="mt-1 text-sm text-muted-foreground">{product.category_name ?? "Category"}</p>
                                        <p className="mt-2 text-sm font-semibold text-foreground">{currencyFormatter.format(product.price)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => startEditingProduct(product)}
                                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No products yet.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground">Your customers</h2>
                    <div className="mt-6 space-y-4">
                        {dashboard.customers.length > 0 ? (
                            dashboard.customers.map((customer) => (
                                <div key={customer.uuid} className="rounded-2xl border border-border bg-background p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-foreground">
                                                {customer.full_name?.trim() || customer.email}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">{customer.phone || "No phone"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-foreground">{customer.order_count} orders</p>
                                            <p className="mt-1 text-sm text-muted-foreground">{currencyFormatter.format(customer.total_spent)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No customers yet.</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground">Orders for your products</h2>
                <div className="mt-6 space-y-4">
                    {dashboard.orders.length > 0 ? (
                        dashboard.orders.map((order) => (
                            <div key={order.uuid} className="rounded-2xl border border-border bg-background p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-base font-semibold text-foreground">Order #{order.uuid.slice(0, 8)}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {order.customer_name?.trim() || order.customer_email || "Customer"}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-foreground">{currencyFormatter.format(order.total_amount)}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-orange-500">{order.status}</p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {order.items.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={item.product_uuid ? `/products/${item.product_uuid}` : "/products"}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                                        >
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                                                {resolveMediaUrl(item.product_image_url) ? (
                                                    <img src={resolveMediaUrl(item.product_image_url) ?? undefined} alt={item.product_title ?? "Product"} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                        {item.category_name ?? "Item"}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">{item.product_title ?? "Product"}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">Qty {item.quantity}</p>
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
                                {order.status === "pending" ? (
                                    <button
                                        type="button"
                                        onClick={() => void handleConfirmOrder(order.uuid)}
                                        disabled={busyOrderUuid === order.uuid}
                                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Confirm order
                                    </button>
                                ) : null}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No orders yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
