import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import type { MyBooking, BookingStatus } from '@/src/types/bookings';
import { fetchDriverMyBookings, type DriverMyBookingDto, cancelDriverBooking } from '@/src/services/api/bookingsApi';
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
    if (dto.status === 'canceled') status = 'canceled';
    else if (toMinutes(dto.endTime) <= nowMinutes() || dto.status === 'done') status = 'past';
    else status = 'booked';

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
        phoneNumber: dto.phoneNumber,
    };
};

// маленький helper, чтобы Alert работал как Promise<boolean>
const confirm = (title: string, message: string) =>
    new Promise<boolean>((resolve) => {
        Alert.alert(title, message, [
            { text: 'Нет', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Да, отменить', style: 'destructive', onPress: () => resolve(true) },
        ]);
    });

export function useMyBookings() {
    const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const accessToken = useAuthStore(state => state.accessToken);

    const load = useCallback(async () => {
        // если нет access — не дергаем API вообще
        if (!accessToken) {
            setMyBookings([]);
            return [] as MyBooking[];
        }

        try {
            const raw = await fetchDriverMyBookings();
            const mapped = raw.map(mapDto);

            const booked = mapped
                .filter((b) => b.status === 'booked')
                .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

            const history = mapped
                .filter((b) => b.status !== 'booked')
                .sort((a, b) => toMinutes(b.startTime) - toMinutes(a.startTime));

            const result = [...booked, ...history];
            setMyBookings(result);
            return result;
        } catch (e: any) {
            // "No refresh" — нормальная ситуация, когда нет refresh-токена
            const msg = e?.message ?? '';
            if (msg !== 'No refresh') {
                console.warn('load my bookings failed', e);
            }
            setMyBookings([]);
            return [] as MyBooking[];
        }
    }, [accessToken]);

    useEffect(() => {
        load();
    }, [load]);

    /**
     * Отмена бронирования с подтверждением.
     * @param id ID брони
     * @param opts.confirm — показывать Alert? (по умолчанию true)
     */
    const cancelBooking = useCallback(
        async (id: string, opts: { confirm?: boolean; title?: string; message?: string } = {}) => {
            const { confirm: ask = true, title = 'Отмена записи', message = 'Вы уверены, что хотите отменить запись?' } = opts;

            if (ask) {
                const ok = await confirm(title, message);
                if (!ok) return { success: false, canceledByUser: true };
            }

            try {
                setCancelingId(id);
                await cancelDriverBooking(id);
                await load();
                return { success: true };
            } catch (e) {
                console.warn('cancel booking failed', e);
                return { success: false, error: e };
            } finally {
                setCancelingId(null);
            }
        },
        [load]
    );

    const reload = useCallback(() => load(), [load]);

    return { myBookings, cancelBooking, reload, cancelingId };
}
