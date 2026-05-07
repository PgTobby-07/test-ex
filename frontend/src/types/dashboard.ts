import type { CurrentUser } from "@/types/auth";
import type { Order } from "@/types/order";
import type { Category, Product } from "@/types/product";

export type SellerDashboardStats = {
    product_count: number;
    order_count: number;
    pending_order_count: number;
    customer_count: number;
    total_revenue: number;
};

export type SellerCustomer = {
    uuid: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    order_count: number;
    total_spent: number;
    last_order_at: string | null;
};

export type SellerDashboard = {
    stats: SellerDashboardStats;
    categories: Category[];
    products: Product[];
    orders: Order[];
    customers: SellerCustomer[];
};

export type AdminDashboardStats = {
    user_count: number;
    seller_count: number;
    customer_count: number;
    product_count: number;
    order_count: number;
    pending_order_count: number;
    total_revenue: number;
};

export type AdminDashboard = {
    stats: AdminDashboardStats;
    categories: Category[];
    recent_users: CurrentUser[];
    recent_products: Product[];
    recent_orders: Order[];
};
