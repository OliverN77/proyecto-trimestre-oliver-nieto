export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

export function apiErrorMessage(data, fallback) {
    if (typeof data?.detail === "string") return data.detail
    if (Array.isArray(data?.detail)) {
        return data.detail.map((item) => item.msg || "Dato inválido").join(". ")
    }
    return data?.mensaje || fallback
}

export async function readApiResponse(response) {
    if (response.status === 204) return {}
    return response.json().catch(() => ({}))
}
