// src/services/api/bookingsApi.ts
import { API_BASE_URL } from "@/src/config/env";

export type BookingDto = {
    id: number;
    date: string;                 // '2025-10-05'
    start_slot_index: number;     // 0,1,2...
    slots_count: number;          // длительность в слотах
    status: 'confirmed' | 'done' | 'hold' | 'canceled' | string;
    client_name: string;
    car_number: string;
    total_price: number;
    box_name: string;
    car_wash_name: string;
    created_at: string;
};

export type DriverMyBookingDto = {
    id: string | number;
    carWashId: string | number;
    carWashName: string;
    address: string;
    startTime: string;
    endTime: string;
    boxName?: string | null;
    extra_services?: string[];
    total_price: number;
    status: string;
    latitude?: number;
    longtitude?: number;
    phoneNumber?: string;
};

export async function cancelDriverBooking(bookingId: string | number, token?: string | null) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/driver/delete/bookings/${encodeURIComponent(String(bookingId))}/`, {
        method: 'POST',
        headers,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cancel booking HTTP ${res.status} ${text}`);
    }
    try { return await res.json(); } catch { return; }
}

export async function fetchDriverMyBookings(token: string): Promise<DriverMyBookingDto[]> {
    const res = await fetch(`${API_BASE_URL}/driver/my-booking/`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            // если нужен другой заголовок: 'Auth-token': token,
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`MyBookings HTTP ${res.status} ${text}`);
    }
    return res.json();
}

export async function fetchBookings(params: {
    token: string;
    status?: string;       // 'confirmed' | 'done' | 'hold' | 'canceled'
    date?: string;         // 'YYYY-MM-DD'
}): Promise<BookingDto[]> {
    const url = new URL(`${API_BASE_URL}/dashboard/bookings/`);
    if (params.status) url.searchParams.set('status', params.status);
    if (params.date) url.searchParams.set('date', params.date);

    const res = await fetch(url.toString(), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${params.token}`,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Bookings HTTP ${res.status} ${text}`);
    }
    return res.json();
}
