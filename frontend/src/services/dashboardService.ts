import api from "@/lib/api";
import type { AdminDashboard, SellerDashboard } from "@/types/dashboard";

export async function getSellerDashboard() {
    const response = await api.get<SellerDashboard>("/dashboard/seller");
    return response.data;
}

export async function getAdminDashboard() {
    const response = await api.get<AdminDashboard>("/dashboard/admin");
    return response.data;
}
