"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";

import { FAVORITES_UPDATED_EVENT, notifyFavoritesUpdated } from "@/components/favorite/favoriteEvents";
import { useLocale } from "@/components/locale/LocaleProvider";
import { addFavorite, getFavorites, removeFavorite } from "@/services/favoriteService";

type FavoriteButtonProps = {
    productUuid: string;
    className?: string;
};

export default function FavoriteButton({
    productUuid,
    className = "",
}: FavoriteButtonProps) {
    const router = useRouter();
    const { t } = useLocale();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setIsFavorite(false);
            return;
        }

        let isMounted = true;

        function loadState() {
            void getFavorites()
                .then((result) => {
                    if (!isMounted) {
                        return;
                    }

                    setIsFavorite(result.items.some((item) => item.product.uuid === productUuid));
                })
                .catch(() => {
                    if (!isMounted) {
                        return;
                    }

                    setIsFavorite(false);
                });
        }

        loadState();

        function handleFavoritesUpdated() {
            loadState();
        }

        window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);
        };
    }, [productUuid]);

    async function handleToggleFavorite() {
        const token = localStorage.getItem("token");

        if (!token) {
            toast.info(t("favorites_login_first"));
            router.push("/login");
            return;
        }

        try {
            setIsLoading(true);

            if (isFavorite) {
                await removeFavorite(productUuid);
                setIsFavorite(false);
                toast.success("Removed from favorites.");
            } else {
                await addFavorite(productUuid);
                setIsFavorite(true);
                toast.success("Added to favorites.");
            }

            notifyFavoritesUpdated();
        } catch (error) {
            const message = error instanceof Error ? error.message : t("favorite_update_failed");
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isLoading}
            className={`inline-flex items-center justify-center rounded-full border border-border p-2.5 transition ${
                isFavorite
                    ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
                    : "bg-card text-foreground hover:border-red-500 hover:text-red-500"
            } ${className}`}
            aria-label={isFavorite ? t("favorite_remove") : t("favorite_add")}
        >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
    );
}
