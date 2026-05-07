// src/types/product.ts
export type ProductVariantAttribute = {
    key: string;
    value: string;
};

export type ProductVariant = {
    id: number;
    sku: string;
    attributes: ProductVariantAttribute[];
    size: string | null;
    color: string | null;
    storage: string | null;
    price: number | null;
    stock: number;
};

export type ProductVariantInput = {
    attributes: ProductVariantAttribute[];
    price?: number | null;
    stock: number;
};

export type Product = {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: number;
    category_id: number;
    category_name: string | null;
    category_slug: string | null;
    default_variant_id: number | null;
    available_stock: number;
    variants: ProductVariant[];
    created_at: string;
};

export type Category = {
    id: number;
    name: string;
    slug: string;
};

export type HomeFeedSection = {
    title: string;
    subtitle: string;
    items: Product[];
};

export type HomeFeed = {
    latest_items: HomeFeedSection;
    popular_items: HomeFeedSection;
    most_used_items: HomeFeedSection;
    offers: HomeFeedSection;
    related_items: HomeFeedSection;
    categories: Category[];
};

export type ProductAttributeFacet = {
    key: string;
    values: string[];
};

export type ProductFilterOptions = {
    categories: Category[];
    attribute_facets: ProductAttributeFacet[];
    sizes: string[];
    colors: string[];
    storages: string[];
    min_price: number | null;
    max_price: number | null;
};

export type ProductListResult = {
    items: Product[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type ProductQuery = {
    category_slug?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    attributes?: string[];
    sizes?: string[];
    colors?: string[];
    storages?: string[];
    in_stock?: boolean;
    page?: number;
    limit?: number;
};

export type ProductCreateInput = {
    title: string;
    description?: string | null;
    price: number;
    category_id: number;
    variants: ProductVariantInput[];
};

export type ProductUpdateInput = {
    title?: string;
    description?: string | null;
    price?: number;
    category_id?: number;
};
