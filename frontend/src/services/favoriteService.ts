import api from "@/lib/api";

import type { Favorite, FavoritesResult } from "@/types/favorite";

export async function getFavorites() {
    const response = await api.get<FavoritesResult>("/favorites");
    return response.data;
}

export async function addFavorite(productUuid: string) {
    const response = await api.post<Favorite>("/favorites", {
        product_uuid: productUuid,
    });
    return response.data;
}

export async function removeFavorite(productUuid: string) {
    const response = await api.delete<{ message: string }>(`/favorites/${productUuid}`);
    return response.data;
}
