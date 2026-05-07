import api from "@/lib/api";

import type { CheckoutPaymentIntent, Order } from "@/types/order";

export async function getOrders() {
    const response = await api.get<Order[]>("/orders");
    return response.data;
}

export async function createCheckoutPaymentIntent() {
    const response = await api.post<CheckoutPaymentIntent>("/orders/checkout/payment-intent");
    return response.data;
}

export async function confirmOrder(orderUuid: string) {
    const response = await api.post<Order>(`/orders/${orderUuid}/confirm`);
    return response.data;
}

export async function deleteOrder(orderUuid: string) {
    const response = await api.delete<{ message: string }>(`/orders/${orderUuid}`);
    return response.data;
}
