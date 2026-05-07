"use client";

import Image from "next/image";
import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { useLocale } from "@/components/locale/LocaleProvider";

type AuthWrapperProps = {
    title: string;
    description: string;
    imageSide?: "left" | "right";
    children: React.ReactNode;
};

export default function AuthWrapper({
    title,
    description,
    imageSide = "left",
    children,
}: AuthWrapperProps) {
    const { dir } = useLocale();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLDivElement | null>(null);
    const formRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                imageRef.current,
                { opacity: 0, x: imageSide === "left" ? -80 : 80 },
                { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }
            );

            gsap.fromTo(
                formRef.current,
                { opacity: 0, x: imageSide === "left" ? 80 : -80 },
                { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }
            );
        }, wrapperRef);

        return () => ctx.revert();
    }, [imageSide]);

    return (
        <main ref={wrapperRef} className="min-h-screen w-full bg-background" dir={dir}>
            <section className="grid min-h-screen w-full md:grid-cols-2">
                <div
                    ref={imageRef}
                    className={`relative min-h-[40vh] md:min-h-screen ${imageSide === "left" ? "md:order-1" : "md:order-2"
                        }`}
                >
                    <Image
                        src="/authimage/auth-img.jpg"
                        alt="Authentication"
                        fill
                        priority
                        className="object-cover"
                    />

                    <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

                    <div className="absolute inset-0 flex items-end p-8 md:p-14">
                        <div className="max-w-lg text-white">
                            <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
                            <p className="mt-4 text-base text-white/85 md:text-lg">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    ref={formRef}
                    className={`flex min-h-[60vh] items-center justify-center px-6 py-10 md:min-h-screen md:px-16 ${imageSide === "left" ? "md:order-2" : "md:order-1"
                        }`}
                >
                    <div className="w-full max-w-md rounded-3xl border border-border bg-background/90 p-8 shadow-sm backdrop-blur">
                        {children}
                    </div>
                </div>
            </section>
        </main>
    );
}
