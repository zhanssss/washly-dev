// src/services/api/qrApi.ts
import { API_BASE_URL } from "@/src/config/env";

type Method = "GET" | "POST";

async function req<T = any>(path: string, method: Method, bearer: string | null, body?: any): Promise<T> {
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
export async function createQrSession(washToken: string) {
    return req<CreateQrSessionResponse>(`/driver/qr/session/create/`, "POST", washToken, {});
}

export async function cashApprove(token: string, washToken: string) {
    return req<CashApproveResponse>(`/driver/qr/${encodeURIComponent(token)}/cash/approve/`, "POST", washToken);
}

// --- POLL (обе стороны) ---
export async function pollSession(token: string, anyBearer: string | null) {
    return req<PollResponse>(`/driver/qr/session/${encodeURIComponent(token)}/poll/`, "GET", anyBearer);
}

// --- DRIVER (клиент) ---
export async function scanBooking(token: string, bookingId: number, clientToken: string | null) {
    return req<ScanResponse>(`/driver/qr/${encodeURIComponent(token)}/scan/`, "POST", clientToken, {
        booking_id: bookingId,
    });
}

export async function updateExtras(token: string, extraIds: number[], clientToken: string | null) {
    return req<UpdateExtrasResponse>(`/driver/qr/${encodeURIComponent(token)}/extras/`, "POST", clientToken, {
        extra_ids: extraIds,
    });
}

export async function pay(token: string, method: "card" | "cash", clientToken: string | null) {
    return req<PayResponse>(`/driver/qr/${encodeURIComponent(token)}/pay/`, "POST", clientToken, {
        payment_method: method,
    });
}
