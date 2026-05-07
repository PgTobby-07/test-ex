// src/lib/api.ts
import axios from "axios";
import { notifyAuthUpdated } from "@/components/auth/authEvents";

function normalizeApiUrl(value: string | undefined) {
    if (!value) {
        return value;
    }

    const trimmedValue = value.trim();

    if (
        trimmedValue.startsWith("http://") &&
        !trimmedValue.includes("localhost") &&
        !trimmedValue.includes("127.0.0.1")
    ) {
        return trimmedValue.replace(/^http:\/\//, "https://");
    }

    return trimmedValue;
}

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token automatically (like your fetch version)
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

// Handle errors (like your fetch version)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (typeof window !== "undefined" && error.response.status === 401) {
                localStorage.removeItem("token");
                notifyAuthUpdated();
            }

            const data = error.response.data;

            let message = "API error";

            if (typeof data === "string") {
                message = data;
            } else if (typeof data?.detail === "string") {
                message = data.detail;
            } else if (Array.isArray(data?.detail)) {
                message = data.detail
                    .map((err: { msg?: string }) => err.msg)
                    .filter(Boolean)
                    .join(", ");
            } else if (typeof data?.message === "string") {
                message = data.message;
            } else if (typeof data?.error === "string") {
                message = data.error;
            }

            return Promise.reject(new Error(message));
        }

        return Promise.reject(new Error("Network error"));
    }
);

export default api;
