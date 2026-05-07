import OrdersPageClient from "@/components/order/OrdersPageClient";

export default function OrdersPage() {
    return (
        <main className="min-h-screen bg-background px-4 py-10">
            <section className="mx-auto max-w-7xl">
                <OrdersPageClient />
            </section>
        </main>
    );
}
