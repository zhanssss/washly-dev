export type BookingStatus = 'booked' | 'past' | 'canceled';

export interface MyBooking {
    id: string;
    carWashId: string;
    carWashName: string;
    address: string;
    startTime: string;
    endTime: string;
    boxName?: string;
    services: string[];
    price: number;
    status: BookingStatus;
    latitude?: number;
    longtitude?: number;
    phoneNumber?: string;
}
