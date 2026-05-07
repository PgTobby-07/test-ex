"use client";

import { Suspense, useEffect, useState } from "react";

import { getCategories } from "@/services/productService";
import type { Category } from "@/types/product";

import HeaderTopLinks from "./HeaderTopLinks";
import HeaderMain from "./HeaderMain";
import HeaderNav from "./HeaderNav";

export default function Header() {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        let isMounted = true;

        void getCategories()
            .then((result) => {
                if (!isMounted) {
                    return;
                }

                setCategories(result);
            })
            .catch(() => {
                if (!isMounted) {
                    return;
                }

                setCategories([]);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
            <HeaderTopLinks />
            <Suspense fallback={<div className="mx-auto h-20 max-w-7xl px-4" />}>
                <HeaderMain />
            </Suspense>
            <HeaderNav categories={categories} />
        </header>
    );
}
