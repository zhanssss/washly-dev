import React, { useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '../CarWashDashboard.styles';
import { useAuthStore } from '@/src/stores/authStore';
import { fetchDashboardBookings } from '@/src/services/api/carWashesApi';
import { useQuery } from '@tanstack/react-query';

type Props = {
    carWashOpenTime?: string; // 'HH:MM'
    selectedDate: Date;
    registerRefetch?: (fn: () => Promise<any>) => void; // 👈 добавили
};

const SLOT_MINUTES = 40;

function hhmmToMinutes(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}
function addMinutes(base: Date, minutes: number) {
    const d = new Date(base);
    d.setMinutes(d.getMinutes() + minutes);
    return d;
}

const KZ_TZ = 'Asia/Almaty';
const dateKeyKZ = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-CA', { timeZone: KZ_TZ }); // YYYY-MM-DD

type BookingExtra = { id: number; service_id: number; name: string; price: number };
type DashboardBooking = {
    id: number;
    slot_index: number;
    box: number;
    box_name: string;
    client: number;
    client_phone: string;
    client_car_number: string;
    client_car_body: string;
    car_body: number;
    car_body_name: string;
    extra_services: BookingExtra[];
    total_price: string;
    created_at: string;
    start_time?: string;
    end_time?: string;
};

export default function ActiveBookingsList({
                                               carWashOpenTime = '08:00',
                                               selectedDate,
                                               registerRefetch,
                                           }: Props) {
    const token = useAuthStore(s => s.accessToken);
    const user = useAuthStore(s => s.user);
    const dateStr = useMemo(() => dateKeyKZ(selectedDate), [selectedDate]);

    const q = useQuery({
        queryKey: ['cw-active-bookings', user?.id, dateStr],
        queryFn: async () => {
            if (!token || !user?.id) throw new Error('Нет токена или car_wash_id');
            const data = await fetchDashboardBookings(Number(user.id), token);
            const sameDay = (data as DashboardBooking[]).filter(
                b => dateKeyKZ(b.created_at) === dateStr
            );
            sameDay.sort((a, b) => a.slot_index - b.slot_index || a.box - b.box);
            return sameDay;
        },
        enabled: !!token && !!user?.id,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        staleTime: 0,
    });

    // отдадим родителю возможность дергать refetch
    useEffect(() => {
        registerRefetch?.(q.refetch);
    }, [q.refetch, registerRefetch]);

    if (q.isLoading) {
        return (
            <View style={styles.section}>
                <ActivityIndicator />
            </View>
        );
    }
    if (q.isError) {
        return (
            <View style={styles.section}>
                <Text style={styles.emptyStateText}>Ошибка: {(q.error as Error)?.message || 'загрузка'}</Text>
            </View>
        );
    }

    const items = q.data || [];
    if (items.length === 0) {
        return (
            <View style={styles.section}>
                <Text style={styles.subsectionTitle}>АКТИВНЫЕ ЗАПИСИ</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Нет записей на выбранную дату</Text>
                </View>
            </View>
        );
    }

    const openMinutes = hhmmToMinutes(carWashOpenTime);

    return (
        <View style={styles.section}>
            <Text style={styles.subsectionTitle}>АКТИВНЫЕ ЗАПИСИ</Text>

            {items.map(b => {
                const startLabelFromApi = b.start_time?.slice(0, 5);
                const endLabelFromApi = b.end_time?.slice(0, 5);

                let startLabel = startLabelFromApi;
                let endLabel = endLabelFromApi;

                if (!startLabel || !endLabel) {
                    const startFromOpen = b.slot_index * SLOT_MINUTES;
                    const startTotalMinutes = openMinutes + startFromOpen;
                    const startDate = new Date(selectedDate);
                    startDate.setHours(0, 0, 0, 0);
                    const start = addMinutes(startDate, startTotalMinutes);
                    const end = addMinutes(start, SLOT_MINUTES);
                    startLabel = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    endLabel = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                }

                return (
                    <View key={b.id} style={styles.bookingCard}>
                        <View style={styles.bookingInfo}>
                            {!!b.client_phone && <Text style={styles.bookingCustomer}>{b.client_phone}</Text>}
                            <Text style={styles.bookingService}>Госномер: {b.client_car_number || '—'}</Text>
                            <Text style={styles.bookingPhone}>
                                {b.box_name || `Бокс ${b.box}`} • {b.car_body_name || 'Тип кузова?'}
                            </Text>
                        </View>

                        <View style={styles.bookingDetails}>
                            <Text style={styles.bookingTime}>{startLabel}–{endLabel}</Text>
                            <View style={[styles.bookingStatus, { backgroundColor: '#4CAF50' }]}>
                                <Text style={styles.bookingStatusText}>ПОДТВ.</Text>
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}
