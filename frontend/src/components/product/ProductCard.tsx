"use client";

import Link from "next/link";

import AddToCartButton from "@/components/cart/AddToCartButton";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import { useLocale } from "@/components/locale/LocaleProvider";
import { resolveMediaUrl } from "@/lib/media";
import type { Product } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

export default function ProductCard({
    product,
    categoryLabel,
}: {
    product: Product;
    categoryLabel?: string | null;
}) {
    const { t } = useLocale();
    const imageUrl = resolveMediaUrl(product.image_url);

    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Link
                href={`/products/${product.uuid}`}
                className="block transition hover:opacity-95"
            >
                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={product.title}
                            className="h-52 w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-52 items-center justify-center bg-gradient-to-br from-orange-500/15 via-accent/30 to-background text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            {categoryLabel ?? product.category_name ?? t("header_product")}
                        </div>
                    )}
                </div>
                <h2 className="mt-4 line-clamp-2 font-semibold text-foreground">{product.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {categoryLabel ?? product.category_name ?? t("header_product")}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-foreground">
                        {currencyFormatter.format(product.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {product.available_stock > 0
                            ? `${product.available_stock} ${t("product_in_stock_suffix")}`
                            : t("product_out_of_stock")}
                    </p>
                </div>
            </Link>

            <div className="mt-4 flex items-center gap-3">
                <AddToCartButton
                    variantId={product.default_variant_id}
                    availableStock={product.available_stock}
                    fullWidth
                />
                <FavoriteButton productUuid={product.uuid} />
            </div>
        </div>
    );
}
