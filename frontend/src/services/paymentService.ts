import api from "@/lib/api";

export async function confirmPayment(paymentIntentId: string) {
    const response = await api.post<{ status: string; order_uuid: string }>(
        `/payments/confirm/${paymentIntentId}`
    );
    return response.data;
}
