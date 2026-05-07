import Link from "next/link";

import ProductBannerCarousel from "@/components/home/ProductBannerCarousel";
import { getServerTranslator } from "@/lib/i18n/server";
import { getHomeFeed } from "@/services/productService";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function categoryGradient(seed: string) {
  const themes = [
    "from-orange-500/20 via-amber-400/10 to-transparent",
    "from-sky-500/20 via-cyan-400/10 to-transparent",
    "from-emerald-500/20 via-lime-400/10 to-transparent",
    "from-rose-500/20 via-fuchsia-400/10 to-transparent",
  ];

  const value = seed
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return themes[value % themes.length];
}

function relativeAdded(dateString: string) {
  const createdAt = new Date(dateString);
  const now = new Date();
  const diffHours = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / 36e5));

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export default async function HomePage() {
  const { t } = await getServerTranslator();
  const feed = await getHomeFeed();
  const spotlight = feed.latest_items.items[0] ?? feed.popular_items.items[0] ?? null;

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-border bg-gradient-to-br from-background via-accent/20 to-orange-500/10 p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-500">
              {t("home_badge")}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
              {t("home_title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              {t("home_text")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                {t("home_shop")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
              >
                {t("home_sell")}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {feed.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-orange-500 hover:text-orange-500"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">
                {t("home_spotlight")}
              </p>
              {spotlight ? (
                <div className="mt-4">
                  <div
                    className={`rounded-[1.5rem] bg-gradient-to-br ${categoryGradient(
                      spotlight.category_slug ?? spotlight.uuid
                    )} p-6`}
                  >
                    <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {spotlight.category_name ?? t("home_badge")}
                    </span>
                    <h2 className="mt-6 text-2xl font-bold text-foreground">
                      {spotlight.title}
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {spotlight.description || t("home_text")}
                    </p>
                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          {t("home_live_price")}
                        </p>
                        <p className="mt-1 text-3xl font-bold text-foreground">
                          {currencyFormatter.format(spotlight.price)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added {relativeAdded(spotlight.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("home_spotlight_empty")}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">{t("home_latest_items")}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {feed.latest_items.items.length}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">{t("home_categories")}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {feed.categories.length}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">{t("home_server_sections")}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">5</p>
              </div>
            </div>
          </div>
        </div>

        <ProductBannerCarousel section={feed.latest_items} badge="New" />
        <ProductBannerCarousel section={feed.popular_items} badge="Hot" />
        <ProductBannerCarousel section={feed.most_used_items} badge="Used" />
        <ProductBannerCarousel section={feed.offers} badge="Offer" />
        <ProductBannerCarousel section={feed.related_items} badge="Related" />
      </section>
    </main>
  );
}
