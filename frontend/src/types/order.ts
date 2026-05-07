export type OrderItem = {
    id: number;
    variant_id: number;
    quantity: number;
    price: number;
    product_uuid: string | null;
    product_title: string | null;
    product_image_url: string | null;
    category_name: string | null;
    attributes: { key: string; value: string }[];
    size: string | null;
    color: string | null;
    storage: string | null;
    seller_id: number | null;
};

export type Order = {
    uuid: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    items: OrderItem[];
};

export type CheckoutPaymentIntent = {
    order_uuid: string;
    client_secret: string;
    amount: number;
    status: string;
    payment_status: string;
};
