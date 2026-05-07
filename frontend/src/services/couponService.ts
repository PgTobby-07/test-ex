import api from "@/lib/api";
import type { Coupon } from "@/types/coupon";

export async function getCoupons() {
    const response = await api.get<Coupon[]>("/coupons");
    return response.data;
}
