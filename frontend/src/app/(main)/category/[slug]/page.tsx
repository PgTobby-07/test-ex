import Link from "next/link";
import { notFound } from "next/navigation";

import ProductCard from "@/components/product/ProductCard";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCategory, getProductFilterOptions, getProducts } from "@/services/productService";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { t } = await getServerTranslator();
  const queryParams = await searchParams;

  const normalizeSingle = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const normalizeMany = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value : value ? [value] : [];

  const search = normalizeSingle(queryParams.search)?.trim();
  const minPriceRaw = normalizeSingle(queryParams.min_price)?.trim();
  const maxPriceRaw = normalizeSingle(queryParams.max_price)?.trim();
  const pageRaw = normalizeSingle(queryParams.page)?.trim();
  const attributes = normalizeMany(queryParams.attributes).filter(Boolean);
  const inStock = normalizeSingle(queryParams.in_stock) === "true";
  const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1;

  try {
    const [category, productResult, filterOptions] = await Promise.all([
      getCategory(slug),
      getProducts({
        category_slug: slug,
        search: search || undefined,
        min_price: minPriceRaw ? Number(minPriceRaw) : undefined,
        max_price: maxPriceRaw ? Number(maxPriceRaw) : undefined,
        attributes: attributes.length > 0 ? attributes : undefined,
        in_stock: inStock || undefined,
        page,
        limit: 8,
      }),
      getProductFilterOptions(slug),
    ]);

    const products = productResult.items;

    const buildPageHref = (nextPage: number) => {
      const url = new URLSearchParams();

      if (search) url.set("search", search);
      if (minPriceRaw) url.set("min_price", minPriceRaw);
      if (maxPriceRaw) url.set("max_price", maxPriceRaw);
      for (const attribute of attributes) url.append("attributes", attribute);
      if (inStock) url.set("in_stock", "true");
      if (nextPage > 1) url.set("page", String(nextPage));

      const query = url.toString();
      return query ? `/category/${slug}?${query}` : `/category/${slug}`;
    };

    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-border bg-gradient-to-br from-background via-accent/20 to-orange-500/10 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">
              {t("category_badge")}
            </p>
            <h1 className="mt-3 text-4xl font-bold text-foreground">{category.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("category_text")}
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="h-fit rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-foreground">{t("products_filters")}</h2>
                <Link href={`/category/${slug}`} className="text-sm font-semibold text-orange-500">
                  {t("products_reset")}
                </Link>
              </div>

              <form className="mt-6 space-y-6" method="get">
                {search ? <input type="hidden" name="search" value={search} /> : null}

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("products_price")}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="min_price"
                      placeholder={`Min ${filterOptions.min_price ?? 0}`}
                      defaultValue={minPriceRaw}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-orange-500"
                    />
                    <input
                      type="number"
                      name="max_price"
                      placeholder={`Max ${filterOptions.max_price ?? 0}`}
                      defaultValue={maxPriceRaw}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {filterOptions.attribute_facets.map((facet) => (
                  <div key={facet.key}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {facet.key}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {facet.values.map((value) => {
                        const optionValue = `${facet.key}::${value}`;
                        return (
                          <label key={optionValue} className="flex items-center gap-3 text-sm text-foreground">
                            <input
                              type="checkbox"
                              name="attributes"
                              value={optionValue}
                              defaultChecked={attributes.includes(optionValue)}
                              className="h-4 w-4 accent-orange-500"
                            />
                            {value}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <label className="flex items-center gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="in_stock"
                    value="true"
                    defaultChecked={inStock}
                    className="h-4 w-4 accent-orange-500"
                  />
                  {t("products_in_stock")}
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  {t("products_apply")}
                </button>
              </form>
            </aside>

            <div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-foreground">{category.name} {t("category_products_suffix")}</h2>
                {search ? (
                  <p className="text-sm text-muted-foreground">
                    {t("products_results_for")} "{search}"
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {productResult.total} {t("products_found_suffix")}
                </p>
              </div>

              {products.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-muted-foreground">
                  {t("category_empty")}
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.uuid} product={product} categoryLabel={category.name} />
                  ))}
                </div>
              )}

              {productResult.total_pages > 1 ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={buildPageHref(Math.max(1, page - 1))}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      page === 1
                        ? "pointer-events-none border-border text-muted-foreground opacity-50"
                        : "border-border text-foreground hover:border-orange-500 hover:text-orange-500"
                    }`}
                  >
                    {t("pagination_previous")}
                  </Link>

                  {Array.from({ length: productResult.total_pages }, (_, index) => index + 1).map(
                    (pageNumber) => (
                      <Link
                        key={pageNumber}
                        href={buildPageHref(pageNumber)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          pageNumber === page
                            ? "bg-orange-500 text-white"
                            : "border border-border text-foreground hover:border-orange-500 hover:text-orange-500"
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    )
                  )}

                  <Link
                    href={buildPageHref(Math.min(productResult.total_pages, page + 1))}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      page === productResult.total_pages
                        ? "pointer-events-none border-border text-muted-foreground opacity-50"
                        : "border-border text-foreground hover:border-orange-500 hover:text-orange-500"
                    }`}
                  >
                    {t("pagination_next")}
                  </Link>
                </div>
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
