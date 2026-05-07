"use client";

import { useMemo, useState } from "react";

import AddToCartButton from "@/components/cart/AddToCartButton";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import { useLocale } from "@/components/locale/LocaleProvider";
import type { Product } from "@/types/product";

export default function ProductPurchasePanel({ product }: { product: Product }) {
    const { t } = useLocale();
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        product.default_variant_id
    );
    const [quantity, setQuantity] = useState(1);

    const selectedVariant =
        product.variants.find((variant) => variant.id === selectedVariantId) ??
        product.variants[0] ??
        null;
    const maxQuantity = useMemo(
        () => Math.max(1, Math.min(selectedVariant?.stock ?? product.available_stock, 10)),
        [product.available_stock, selectedVariant?.stock]
    );

    return (
        <div className="mt-8 rounded-[1.5rem] border border-border bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("detail_purchase")}
            </p>

            {product.variants.length > 1 ? (
                <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Choose variant</p>
                    <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant) => {
                            const labels = variant.attributes
                                .map((attribute) => `${attribute.key}: ${attribute.value}`)
                                .join(" • ");

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => setSelectedVariantId(variant.id)}
                                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                        selectedVariant?.id === variant.id
                                            ? "border-orange-500 bg-orange-500 text-white"
                                            : "border-border bg-card text-foreground hover:border-orange-500 hover:text-orange-500"
                                    }`}
                                >
                                    {labels || variant.sku}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    {t("detail_quantity")}
                    <input
                        type="number"
                        min={1}
                        max={maxQuantity}
                        value={quantity}
                        onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            setQuantity(
                                Number.isFinite(nextValue)
                                    ? Math.min(maxQuantity, Math.max(1, nextValue))
                                    : 1
                            );
                        }}
                        className="w-28 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-orange-500"
                    />
                </label>

                <AddToCartButton
                    variantId={selectedVariant?.id ?? product.default_variant_id}
                    availableStock={selectedVariant?.stock ?? product.available_stock}
                    quantity={quantity}
                    label={t("product_add_to_cart")}
                    className="min-w-40"
                />
                <FavoriteButton productUuid={product.uuid} />
            </div>
        </div>
    );
}
