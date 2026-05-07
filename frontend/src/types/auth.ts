export type LoginInput = {
    email: string;
    password: string;
};

export type RegisterInput = {
    full_name: string;
    email: string;
    password: string;
    role: "buyer" | "seller";
    phone?: string;
    shop_name?: string;
};

export type AuthResponse = {
    access_token: string;
    token_type: "bearer";
};

export type CurrentUser = {
    uuid: string;
    email: string;
    full_name: string | null;
    role: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    is_banned: boolean;
    created_at: string;
};

export type UpdateCurrentUserInput = {
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
};
