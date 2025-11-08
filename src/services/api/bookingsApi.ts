// src/services/api/bookingsApi.ts
import { api, dashboardApi, driverApi } from "@/contexts/AuthContext";

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
    phoneNumber: string;
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
    longitude?: number;   // исправлено (если бек шлёт longtitude — держи оба поля опционально)
    longtitude?: number;  // оставлено для совместимости
};

// Отмена брони водителя
export async function cancelDriverBooking(bookingId: string | number) {
    const res = await driverApi.post(`/delete/bookings/${encodeURIComponent(String(bookingId))}/`);
    return res.data;
}

export async function fetchDriverMyBookings(): Promise<DriverMyBookingDto[]> {
    const res = await driverApi.get(`/my-booking/`);
    return res.data as DriverMyBookingDto[];
}

export async function fetchBookings(params: {
    status?: string;
    date?: string;
}): Promise<BookingDto[]> {
    const res = await dashboardApi.get(`/bookings/`, {
        params: {
            ...(params.status ? { status: params.status } : {}),
            ...(params.date ? { date: params.date } : {}),
        },
    });
    return res.data as BookingDto[];
}