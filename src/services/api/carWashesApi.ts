// src/services/api/carWashesApi.ts
import { API_BASE_URL } from "@/src/config/env";
import { useAuthStore } from "@/src/stores/authStore";
// ---------- БАЗОВЫЕ ТИПЫ ----------
export type BackendCarWash = {
    id: number;
    name: string;
    address: string;
    coords: { lat: number; lon: number };
    open_time: string;
    close_time: string;
    open_now: boolean;
    image_url: string | null;
    boxes_total: number;
    min_price: number | null;
    phone?: string | null;
};

export type CarWash = {
    open_now: boolean | undefined;
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    image: string;
    rating: number;
    price: number;
    workingHours: string;
    workingHoursDetailed: { start: string; end: string; is24Hours: boolean };
    phone?: string;
    services: string[];
    availableServices: any[];
};

const toAbsolute = (url?: string | null) =>
    url && /^https?:\/\//i.test(url)
        ? url
        : `${API_BASE_URL}${url ? (url.startsWith('/') ? '' : '/') + url : '/placeholder.jpg'}`;

const adapt = (b: BackendCarWash): CarWash => ({
    id: String(b.id),
    name: b.name,
    address: b.address,
    latitude: b.coords?.lat ?? 0,
    longitude: b.coords?.lon ?? 0,
    image: toAbsolute(b.image_url),
    rating: 4.7, // заглушка
    price: b.min_price ?? 0,
    workingHours: `${b.open_time || '00:00'}–${b.close_time || '00:00'}`,
    workingHoursDetailed: {
        start: b.open_time || '00:00',
        end: b.close_time || '00:00',
        is24Hours: (b.open_time === '00:00' && b.close_time === '00:00') || false,
    },
    phone: b.phone ?? '',
    services: [],
    availableServices: [],
    open_now: undefined
});

// корень-список ИЛИ items[]
function extractItems(json: any): BackendCarWash[] {
    if (Array.isArray(json)) return json as BackendCarWash[];
    if (Array.isArray(json?.items)) return json.items as BackendCarWash[];
    return [];
}

export async function fetchCarWashes(limit = 20, offset = 0): Promise<CarWash[]> {
    const url = `${API_BASE_URL}/driver/carwashes?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return extractItems(json).map(adapt);
}

// ---------- ДЕТАЛИ МОЙКИ ----------
export type BackendCarWashDetail = {
    id: number;
    name: string;
    address: string | null;
    coords: { lat: number | null; lon: number | null };
    open_time: string;
    close_time: string;
    slot_minutes: number;
    buffer_minutes: number;
    phone: string | null;
    boxes_total: number;
    min_price: number | null;
    body_prices: { body_id: number; body_name: string; price: number }[];
    extra_services: { id: number; name: string; price: number }[];
    boxes: { id: number; name: string; is_available: boolean }[];
};

export type CarWashDetail = {
    id: number;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    openTime: string;
    closeTime: string;
    slotMinutes: number;
    bufferMinutes: number;
    phone: string | null;
    boxesTotal: number;
    minPrice: number | null;
    bodyPrices: { bodyId: number; bodyName: string; price: number }[];
    extraServices: { id: number; name: string; price: number }[];
    boxes: Box[];
};

function adaptDetail(d: BackendCarWashDetail): CarWashDetail {
    return {
        id: d.id,
        name: d.name,
        address: d.address,
        latitude: d.coords?.lat ?? null,
        longitude: d.coords?.lon ?? null,
        openTime: d.open_time,
        closeTime: d.close_time,
        slotMinutes: d.slot_minutes,
        bufferMinutes: d.buffer_minutes,
        phone: d.phone,
        boxesTotal: d.boxes_total,
        minPrice: d.min_price,
        bodyPrices: d.body_prices.map((bp) => ({
            bodyId: bp.body_id,
            bodyName: bp.body_name,
            price: bp.price,
        })),
        extraServices: d.extra_services.map((es) => ({
            id: es.id,
            name: es.name,
            price: es.price,
        })),
        boxes: Array.isArray(d.boxes) ? d.boxes.map(adaptBox) : [],
    };
}

export async function fetchCarWashDetail(carWashId: number): Promise<CarWashDetail> {
    const res = await fetch(`${API_BASE_URL}/driver/carwashes/${carWashId}/`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: BackendCarWashDetail = await res.json();
    return adaptDetail(json);
}

// ---------- БОКСЫ ----------
export type BackendBox = { id: number; name: string; is_available: boolean };
export type Box = { id: number; name: string; isAvailable: boolean };

function adaptBox(b: BackendBox): Box {
    return { id: b.id, name: b.name, isAvailable: b.is_available };
}

export async function fetchBoxes(carWashId: number): Promise<Box[]> {
    const res = await fetch(`${API_BASE_URL}/driver/carwashes/${carWashId}/boxes/`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items: BackendBox[] = Array.isArray(json?.items) ? json.items : [];
    return items.map(adaptBox);
}

export type BackendSlotRow = {
    slot_index: number;
    starts_at: string;
    ends_at: string;
    status: 'free' | 'hold' | 'booked';
};
export type BoxSlotsResponse = {
    box_id: number;
    date: string; // YYYY-MM-DD
    items: BackendSlotRow[];
};

export async function fetchBoxSlots(
    carWashId: number,
    boxId: number,
    date: string
): Promise<BoxSlotsResponse> {
    const url = `${API_BASE_URL}/driver/carwashes/${carWashId}/boxes/${boxId}/slots/?date=${encodeURIComponent(date)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ---------- ПОИСК ДОСТУПНЫХ СТАРТОВ ----------
export type AvailableStart = {
    box_id: number;
    slot_index: number;
    starts_at: string;
    ends_at: string;
};

export async function fetchAvailability(
    carWashId: number,
    date: string,           // YYYY-MM-DD
    durationMin: number     // суммарная длительность услуги + допы
): Promise<AvailableStart[]> {
    const res = await fetch(`${API_BASE_URL}/driver/availability/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car_wash_id: carWashId, date, duration_min: durationMin }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export type ActiveBookingExistsResponse = {
    error_code: 'ACTIVE_BOOKING_EXISTS';
    message: string;
    active_booking: {
        booking_id: string;
        box_id: string;
        date: string;        // YYYY-MM-DD
        start_time: string;  // ISO
        end_time: string;    // ISO
    };
    replace_existing?: boolean;
};

export class ActiveBookingExistsError extends Error {
    code: 'ACTIVE_BOOKING_EXISTS';
    details: ActiveBookingExistsResponse['active_booking'];
    constructor(message: string, details: ActiveBookingExistsResponse['active_booking']) {
        super(message);
        this.name = 'ActiveBookingExistsError';
        this.code = 'ACTIVE_BOOKING_EXISTS';
        this.details = details;
    }
}

export type CreateBookingPayload = {
    car_wash: number;           // id автомойки
    box: number;                // id бокса
    slot_index: number;         // индекс слота из /slots
    client: number;             // id пользователя
    car_body: number;           // id типа кузова
    extra_services: number[];   // ids допов
    total_price: number;        // сумма
    replace_existing?: boolean;
};

export async function createBooking(
    payload: CreateBookingPayload,
    accessToken?: string | null
): Promise<{ id: number; status: string }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const res = await fetch(`${API_BASE_URL}/driver/bookings/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let json: any = null;
        try { json = await res.json(); } catch {}

        if (res.status === 400 && json?.error_code === 'ACTIVE_BOOKING_EXISTS') {
            const err = json as ActiveBookingExistsResponse;
            throw new ActiveBookingExistsError(err.message, err.active_booking);
        }

        if (res.status === 401) throw new Error('Unauthorized (401): проверьте accessToken.');
        const txt = json?.message || json || (await res.text().catch(() => ''));
        throw new Error(`HTTP ${res.status}${txt ? `: ${typeof txt === 'string' ? txt : ''}` : ''}`);
    }

    return res.json();
}

// (опционально, если нужно владельцу мойки смотреть брони)
export async function fetchDashboardBookings(carWashId: number) {
    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_BASE_URL}/dashboard/bookings/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
