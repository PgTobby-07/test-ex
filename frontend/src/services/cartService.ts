import api from "@/lib/api";

import type { AddCartItemInput, Cart, CartItem } from "@/types/cart";

export async function getCart() {
    const response = await api.get<Cart>("/cart");
    return response.data;
}

export async function addCartItem(data: AddCartItemInput) {
    const response = await api.post<CartItem>("/cart/items", data);
    return response.data;
}

export async function updateCartItem(variantId: number, quantity: number) {
    const response = await api.patch<CartItem>(`/cart/items/${variantId}`, null, {
        params: {
            quantity,
        },
    });
    return response.data;
}

export async function removeCartItem(variantId: number) {
    const response = await api.delete<{ message: string }>(`/cart/items/${variantId}`);
    return response.data;
}

export async function applyCartCoupon(code: string) {
    const response = await api.post<Cart>("/cart/coupon", { code });
    return response.data;
}

export async function removeCartCoupon() {
    const response = await api.delete<Cart>("/cart/coupon");
    return response.data;
}
