import { Suspense } from "react";

import CheckoutPageClient from "@/components/checkout/CheckoutPageClient";

export default function CheckoutPage() {
    return (
        <main className="min-h-screen bg-background px-4 py-10">
            <section className="mx-auto max-w-7xl">
                <Suspense fallback={<div className="rounded-[2rem] border border-border bg-card p-8 text-muted-foreground">Loading checkout...</div>}>
                    <CheckoutPageClient />
                </Suspense>
            </section>
        </main>
    );
}
