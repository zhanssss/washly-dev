import { useEffect, useState, useCallback } from 'react';
import type { MyBooking, BookingStatus } from '@/src/types/bookings';
import { fetchDriverMyBookings, type DriverMyBookingDto,cancelDriverBooking } from '@/src/services/api/bookingsApi';
import { useAuthStore } from '@/src/stores/authStore';

const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};
const nowMinutes = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
};

const mapDto = (dto: DriverMyBookingDto): MyBooking => {
    let status: BookingStatus;
    if (dto.status === 'canceled') {
        status = 'canceled';
    } else if (toMinutes(dto.endTime) <= nowMinutes() || dto.status === 'done') {
        status = 'past';
    } else {
        status = 'booked';
    }

    return {
        id: String(dto.id),
        carWashId: String(dto.carWashId),
        carWashName: dto.carWashName,
        address: dto.address,
        startTime: dto.startTime,
        endTime: dto.endTime,
        boxName: dto.boxName || undefined,
        services: dto.extra_services ?? [],
        price: Number(dto.total_price ?? 0),
        status,
        latitude: dto.latitude,
        longtitude: dto.longtitude,

        // 👇 NEW
        phoneNumber: dto.phoneNumber,
    };
};


// useMyBookings.ts
export function useMyBookings() {
    const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
    const accessToken = useAuthStore((s) => s.accessToken as string | null);

    const load = useCallback(async (token?: string | null) => {
        if (!token) { setMyBookings([]); return [] as MyBooking[]; }
        try {
            const raw = await fetchDriverMyBookings(token);
            const mapped = raw.map(mapDto);

            const booked = mapped
                .filter(b => b.status === 'booked')
                .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

            const history = mapped
                .filter(b => b.status !== 'booked')
                .sort((a, b) => toMinutes(b.startTime) - toMinutes(a.startTime));

            const result = [...booked, ...history];
            setMyBookings(result);
            return result; // 👈 ВАЖНО: возвращаем актуальные данные
        } catch (e) {
            console.warn('load my bookings failed', e);
            setMyBookings([]);
            return [] as MyBooking[];
        }
    }, []);

    useEffect(() => { load(accessToken); }, [accessToken, load]);

    const cancelBooking = useCallback(async (id: string) => {
        if (!accessToken) return;
        try {
            await cancelDriverBooking(id, accessToken);
            await load(accessToken);
        } catch (e) {
            console.warn('cancel booking failed', e);
        }
    }, [accessToken, load]);

    const reload = useCallback(() => load(accessToken), [load, accessToken]); // 👈 теперь Promise<MyBooking[]>

    return { myBookings, cancelBooking, reload };
}
