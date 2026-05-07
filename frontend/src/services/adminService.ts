import api from "@/lib/api";
import type { CurrentUser } from "@/types/auth";
import type { Category } from "@/types/product";

export async function createAdminCategory(data: {
    name: string;
    slug: string;
    parent_id?: number | null;
}) {
    const response = await api.post<Category>("/admin/categories", data);
    return response.data;
}

export async function deleteAdminCategory(categoryId: number) {
    const response = await api.delete<{ message: string }>(`/admin/categories/${categoryId}`);
    return response.data;
}

export async function deleteAdminProduct(productUuid: string) {
    const response = await api.delete<{ message: string }>(`/admin/products/${productUuid}`);
    return response.data;
}

export async function deactivateAdminUser(userUuid: string) {
    const response = await api.patch<CurrentUser>(`/admin/users/${userUuid}/deactivate`);
    return response.data;
}

export async function deleteAdminUser(userUuid: string) {
    const response = await api.delete<{ message: string }>(`/admin/users/${userUuid}`);
    return response.data;
}
