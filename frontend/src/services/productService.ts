// src/services/productService.ts
import api from "@/lib/api";
import type {
    Category,
    HomeFeed,
    Product,
    ProductCreateInput,
    ProductFilterOptions,
    ProductListResult,
    ProductQuery,
    ProductUpdateInput,
} from "@/types/product";

export async function getProducts(params?: ProductQuery) {
    const response = await api.get<ProductListResult>("/products/", {
        params: {
            ...params,
            attributes: params?.attributes,
            sizes: params?.sizes?.join(","),
            colors: params?.colors?.join(","),
            storages: params?.storages?.join(","),
        },
    });
    return response.data;
}

export async function getCategories() {
    const response = await api.get<Category[]>("/products/categories");
    return response.data;
}

export async function getCategory(slug: string) {
    const response = await api.get<Category>(`/products/categories/${slug}`);
    return response.data;
}

export async function getHomeFeed() {
    const response = await api.get<HomeFeed>("/products/home");
    return response.data;
}

export async function getProduct(uuid: string) {
    const response = await api.get<Product>(`/products/${uuid}`);
    return response.data;
}

export async function getProductFilterOptions(categorySlug?: string) {
    const response = await api.get<ProductFilterOptions>("/products/filter-options", {
        params: {
            category_slug: categorySlug,
        },
    });
    return response.data;
}

export async function createProduct(data: ProductCreateInput) {
    const response = await api.post<Product>("/products/", data);
    return response.data;
}

export async function updateProduct(productUuid: string, data: ProductUpdateInput) {
    const response = await api.patch<Product>(`/products/${productUuid}`, data);
    return response.data;
}

export async function uploadProductImage(productUuid: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{ image_url: string }>(
        `/products/${productUuid}/upload-image`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
}
