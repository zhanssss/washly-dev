// src/data/bookings/myBookings.mock.ts
import type { MyBooking } from '@/src/types/bookings';


export const todayMyBookingsMock: MyBooking[] = [
    {
        id: 'bk_1',
        carWashId: '1',
        carWashName: 'FastWash Almaty',
        address: 'г. Алматы, ул. Абая 10',
        startTime: '15:30',
        endTime:   '16:10',
        boxName: 'Бокс 2',
        services: ['Седан', 'Мойка багажника'],
        price: 4500,
        status: 'booked',
        latitude: 40,
        longtitude: 40,
    },
    {
        id: 'bk_2',
        carWashId: '2',
        carWashName: 'Auto Spa Deluxe',
        address: 'г. Алматы, пр. Достык 155',
        startTime: '18:00',
        endTime:   '18:40',
        boxName: 'Бокс 1',
        services: ['Кроссовер'],
        price: 5000,
        status: 'canceled',
        latitude: 40,
        longtitude: 40,
    },
];
