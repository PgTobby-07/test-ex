export type AddCartItemInput = {
    variant_id: number;
    quantity?: number;
};

export type CartItem = {
    id: number;
    variant_id: number;
    product_id: number | null;
    product_uuid: string | null;
    product_title: string | null;
    product_image_url: string | null;
    category_name: string | null;
    category_slug: string | null;
    unit_price: number;
    line_total: number;
    attributes: { key: string; value: string }[];
    size: string | null;
    color: string | null;
    storage: string | null;
    stock: number;
    quantity: number;
};

export type Cart = {
    id: number;
    user_id: number;
    items_count: number;
    subtotal: number;
    discount_percent: number;
    discount_amount: number;
    total_after_discount: number;
    applied_coupon_code: string | null;
    items: CartItem[];
};
