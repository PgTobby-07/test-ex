import Link from "next/link";
import { notFound } from "next/navigation";

import { resolveMediaUrl } from "@/lib/media";
import { getServerTranslator } from "@/lib/i18n/server";
import ProductPurchasePanel from "@/components/product/ProductPurchasePanel";
import RelatedProductsCarousel from "@/components/product/RelatedProductsCarousel";
import { getProduct, getProducts } from "@/services/productService";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const { t } = await getServerTranslator();

  try {
    const product = await getProduct(uuid);
    const imageUrl = resolveMediaUrl(product.image_url);
    const attributeLabels = Array.from(
      new Set(
        product.variants.flatMap((variant) =>
          variant.attributes.map((attribute) => `${attribute.key}: ${attribute.value}`)
        )
      )
    );
    const relatedProducts = product.category_slug
      ? (await getProducts({ category_slug: product.category_slug, limit: 4 })).items.filter(
          (item) => item.uuid !== product.uuid
        )
      : [];

    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <section className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
                <div className="overflow-hidden rounded-[1.5rem] border border-border bg-muted">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="h-[420px] w-full object-cover md:h-[560px]"
                    />
                  ) : (
                    <div className="flex h-[420px] items-center justify-center bg-gradient-to-br from-orange-500/15 via-accent/30 to-background text-base font-semibold uppercase tracking-[0.32em] text-muted-foreground md:h-[560px]">
                      {product.category_name ?? "Product"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("detail_category")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {product.category_name ?? "Uncategorized"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("detail_added")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("detail_availability")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {t("detail_in_catalog")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">
                  {product.category_name ?? t("products_title")}
                </p>
                <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">
                  {product.title}
                </h1>
                <p className="mt-4 text-3xl font-bold text-foreground">
                  {currencyFormatter.format(product.price)}
                </p>
                <p className="mt-6 text-base leading-8 text-muted-foreground">
                  {product.description || t("category_empty")}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {attributeLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                </div>

                <ProductPurchasePanel product={product} />

                <div className="mt-8 rounded-[1.5rem] border border-border bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t("detail_why_buy")}</p>
                  <ul className="mt-4 space-y-3 text-sm text-foreground/85">
                    <li>{t("detail_reason_1")}</li>
                    <li>{t("detail_reason_2")}</li>
                    <li>{t("detail_reason_3")}</li>
                  </ul>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={product.category_slug ? `/category/${product.category_slug}` : "/products"}
                    className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                  >
                    {t("detail_related_category")}
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    {t("detail_back_products")}
                  </Link>
                </div>
              </div>

              {relatedProducts.length > 0 ? (
                <RelatedProductsCarousel
                  products={relatedProducts}
                  categoryName={product.category_name}
                  categorySlug={product.category_slug}
                />
              ) : null}
            </div>
          </div>
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}
