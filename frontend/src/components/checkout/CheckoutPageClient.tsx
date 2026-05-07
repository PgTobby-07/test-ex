"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";

import { notifyCartUpdated } from "@/components/cart/cartEvents";
import { useLocale } from "@/components/locale/LocaleProvider";
import { confirmPayment } from "@/services/paymentService";

type StripeWindow = Window & {
    Stripe?: (publishableKey: string) => any;
};

function loadStripeScript() {
    return new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("Stripe can only load in the browser"));
            return;
        }

        if ((window as StripeWindow).Stripe) {
            resolve();
            return;
        }

        const existing = document.querySelector('script[data-stripe-js="true"]');
        if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Failed to load Stripe")));
            return;
        }

        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.dataset.stripeJs = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Stripe"));
        document.head.appendChild(script);
    });
}

export default function CheckoutPageClient() {
    const router = useRouter();
    const { t } = useLocale();
    const searchParams = useSearchParams();
    const cardElementRef = useRef<HTMLDivElement | null>(null);
    const cardElementInstanceRef = useRef<any>(null);
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStripe, setIsLoadingStripe] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    const clientSecret = searchParams.get("client_secret");
    const orderUuid = searchParams.get("order_uuid");
    const amount = Number(searchParams.get("amount") ?? "0");
    const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount || 0);

    useEffect(() => {
        let isMounted = true;

        async function initStripe() {
            const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

            if (!publishableKey) {
                setMessage("Stripe publishable key is missing.");
                setIsLoadingStripe(false);
                return;
            }

            if (!clientSecret || !orderUuid) {
                setMessage("Missing checkout data.");
                setIsLoadingStripe(false);
                return;
            }

            try {
                await loadStripeScript();

                if (!isMounted) {
                    return;
                }

                const stripeFactory = (window as StripeWindow).Stripe;

                if (!stripeFactory) {
                    throw new Error("Stripe did not load");
                }

                const stripe = stripeFactory(publishableKey);
                stripeRef.current = stripe;
                elementsRef.current = stripe.elements();

                const card = elementsRef.current.create("card", {
                    style: {
                        base: {
                            color: "#111827",
                            fontFamily: "system-ui, sans-serif",
                            fontSize: "16px",
                            "::placeholder": {
                                color: "#6b7280",
                            },
                        },
                    },
                });

                if (!cardElementRef.current) {
                    throw new Error("Card element container missing");
                }

                card.mount(cardElementRef.current);
                cardElementInstanceRef.current = card;
                setIsReady(true);
            } catch (error) {
                setMessage(error instanceof Error ? error.message : t("checkout_init_failed"));
            } finally {
                setIsLoadingStripe(false);
            }
        }

        void initStripe();

        return () => {
            isMounted = false;
            cardElementInstanceRef.current?.destroy?.();
            cardElementInstanceRef.current = null;
            elementsRef.current = null;
            stripeRef.current = null;
        };
    }, [clientSecret, orderUuid]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const stripe = stripeRef.current;
        const elements = elementsRef.current;

        if (!stripe || !elements || !clientSecret) {
            toast.error("Stripe is not ready yet.");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElementInstanceRef.current,
                },
            });

            if (result.error) {
                toast.error(result.error.message ?? "Payment failed.");
                return;
            }

            if (result.paymentIntent?.status === "succeeded") {
                await confirmPayment(result.paymentIntent.id);
                notifyCartUpdated();
                toast.success("Payment successful.");
                router.push("/orders");
                router.refresh();
                return;
            }

            toast.info("Payment is processing.");
            router.push("/orders");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment failed.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (message) {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
                <p className="mt-3 text-muted-foreground">{message}</p>
                <button
                    type="button"
                    onClick={() => router.push("/cart")}
                    className="mt-6 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                    {t("checkout_back_cart")}
                </button>
            </div>
        );
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-foreground">{t("checkout_title")}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {`Order ${orderUuid ? `#${orderUuid.slice(0, 8)}` : ""} ${t("checkout_order_prepared")}`}
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <div ref={cardElementRef} className="min-h-12" />
                    </div>

                    <button
                        type="submit"
                        disabled={!isReady || isSubmitting || isLoadingStripe}
                        className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <>
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                {t("checkout_processing")}
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="h-4 w-4" />
                                {t("checkout_pay")} {formattedAmount}
                            </>
                        )}
                    </button>
                </form>
            </section>

            <aside className="h-fit rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28">
                <h2 className="text-xl font-bold text-foreground">{t("checkout_summary")}</h2>
                <div className="mt-6 space-y-3 text-sm text-foreground">
                    <div className="flex items-center justify-between">
                        <span>{t("checkout_amount")}</span>
                        <span className="font-semibold">{formattedAmount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>{t("checkout_status")}</span>
                        <span className="font-semibold text-orange-500">{t("checkout_pending")}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.push("/cart")}
                    className="mt-6 w-full rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-orange-500 hover:text-orange-500"
                >
                    {t("checkout_back_cart")}
                </button>
            </aside>
        </div>
    );
}
