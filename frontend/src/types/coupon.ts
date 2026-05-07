export type Coupon = {
    code: string;
    title: string;
    description: string | null;
    discount_percent: number;
    starts_at: string;
    ends_at: string;
};
