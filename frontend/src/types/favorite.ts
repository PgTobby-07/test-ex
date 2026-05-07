import type { Product } from "@/types/product";

export type Favorite = {
    id: number;
    product: Product;
};

export type FavoritesResult = {
    items: Favorite[];
    count: number;
};
