// src/services/api/qrApi.ts
import { API_BASE_URL } from "@/src/config/env";
import { useAuthStore } from "@/src/stores/authStore";
const getBearer = () => useAuthStore.getState().accessToken

type Method = "GET" | "POST";

async function req<T = any>(path: string, method: Method, body?: any): Promise<T> {
    const bearer = getBearer();
    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                "Authorization": `Bearer ${bearer}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (e: any) {
        throw new Error(e?.message || "Network request failed");
    }

    const text = await res.text().catch(() => "");
    if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
            const j = text ? JSON.parse(text) : null;
            if (j?.detail) msg += `: ${j.detail}`;
            else if (j?.message) msg += `: ${j.message}`;
        } catch {}
        throw new Error(msg || "HTTP error");
    }

    try {
        return (text ? JSON.parse(text) : {}) as T;
    } catch {
        return {} as T;
    }
}

/* ==================== ТИПЫ ОТВЕТОВ ==================== */

// 1) Мойка создаёт сессию
export type CreateQrSessionResponse = {
    id: string;
    token: string;
    qr_url: string;        // "washly://qr/<token>"
    status: "initiated";
    expires_at: string;    // ISO
};

// 2) Клиент сканирует
export type ScanResponse = { ok: true };

// 3) Обе стороны поллят состояние
export type PollResponse = {
    status: "initiated" | "scanned" | "awaiting_extras" | "extras_selected" | "cash_waiting_approval" | "paid" | "closed" | "expired" | string;
    carWashId: number;
    boxId: number | null;
    bookingId: number;
    clientId: number;
    selected_extra_ids: number[];
    amount_total: string;          // "40532.00"
    expires_in_seconds: number;    // сколько осталось жить сессии
};

// 4) Обновление допов
export type UpdateExtrasResponse = {
    ok: true;
    amount_total: string;          // "40532.00"
};

// 5) Оплата
export type PayResponse = {
    ok: true;
    next?: "wait_for_cash_approval"; // для cash
};

// 6) Подтверждение наличных на стороне мойки
export type CashApproveResponse = { ok: true };

/* ==================== ФУНКЦИИ ==================== */

// --- DASHBOARD (мойка) ---
export async function createQrSession() {
    return req<CreateQrSessionResponse>(`/driver/qr/session/create/`, "POST", {});
}

export async function cashApprove(token: string) {
    return req<CashApproveResponse>(`/driver/qr/${encodeURIComponent(token)}/cash/approve/`, "POST");
}

// --- POLL (обе стороны) ---
export async function pollSession(token: string) {
    return req<PollResponse>(`/driver/qr/session/${encodeURIComponent(token)}/poll/`, "GET");
}

// --- DRIVER (клиент) ---
export async function scanBooking(token: string, bookingId: number) {
    return req<ScanResponse>(`/driver/qr/${encodeURIComponent(token)}/scan/`, "POST", {
        booking_id: bookingId,
    });
}

export async function updateExtras(token: string, extraIds: number[]) {
    return req<UpdateExtrasResponse>(`/driver/qr/${encodeURIComponent(token)}/extras/`, "POST", {
        extra_ids: extraIds,
    });
}

export async function pay(token: string, method: "card" | "cash") {
    return req<PayResponse>(`/driver/qr/${encodeURIComponent(token)}/pay/`, "POST", {
        payment_method: method,
    });
}
