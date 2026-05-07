import api from "@/lib/api";

import type {
    AuthResponse,
    CurrentUser,
    LoginInput,
    RegisterInput,
    UpdateCurrentUserInput,
} from "@/types/auth";

export async function loginUser(data: LoginInput) {
    const response = await api.post<AuthResponse>("/users/login", data);
    return response.data;
}

export async function registerUser(data: RegisterInput) {
    const response = await api.post("/users/register", data);
    return response.data;
}

export async function getCurrentUser() {
    const response = await api.get<CurrentUser>("/users/me");
    return response.data;
}

export async function updateCurrentUser(data: UpdateCurrentUserInput) {
    const response = await api.patch<CurrentUser>("/users/me", data);
    return response.data;
}

export async function uploadCurrentUserAvatar(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<CurrentUser>("/users/me/avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}
