"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";

import { addCartItem } from "@/services/cartService";
import { notifyCartUpdated } from "@/components/cart/cartEvents";
import { useLocale } from "@/components/locale/LocaleProvider";

type AddToCartButtonProps = {
    variantId: number | null;
    availableStock: number;
    quantity?: number;
    label?: string;
    className?: string;
    fullWidth?: boolean;
};

export default function AddToCartButton({
    variantId,
    availableStock,
    quantity = 1,
    label = "Add to cart",
    className = "",
    fullWidth = false,
}: AddToCartButtonProps) {
    const router = useRouter();
    const { t } = useLocale();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDisabled = useMemo(
        () => !variantId || availableStock <= 0 || isSubmitting,
        [availableStock, isSubmitting, variantId]
    );

    async function handleAddToCart() {
        const token = localStorage.getItem("token");

        if (!token) {
            toast.info(t("cart_login_first_add"));
            router.push("/login");
            return;
        }

        if (!variantId) {
            toast.error(t("cart_product_not_ready"));
            return;
        }

        if (availableStock <= 0) {
            toast.error("This product is out of stock.");
            return;
        }

        try {
            setIsSubmitting(true);
            await addCartItem({
                variant_id: variantId,
                quantity,
            });
            notifyCartUpdated();
            toast.success(t("cart_added"));
        } catch (error) {
            const message = error instanceof Error ? error.message : t("cart_add_failed");
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleAddToCart}
            disabled={isDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                isDisabled
                    ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                    : "bg-orange-500 text-white hover:bg-orange-600"
            } ${fullWidth ? "w-full" : ""} ${className}`}
        >
            <ShoppingCart className="h-4 w-4" />
            <span>{availableStock > 0 ? label : t("product_out_of_stock")}</span>
        </button>
    );
}
