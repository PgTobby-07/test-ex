function normalizeApiUrl(value: string | undefined) {
    if (!value) {
        return "";
    }

    const trimmedValue = value.trim().replace(/\/$/, "");

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

export function resolveMediaUrl(path?: string | null) {
    if (!path) {
        return null;
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    if (path.startsWith("/")) {
        return `${API_URL}${path}`;
    }

    if (path.startsWith("uploads/")) {
        return `${API_URL}/${path}`;
    }

    return path;
}
