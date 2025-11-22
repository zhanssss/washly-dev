    // stores/authStore.ts
    import {create} from 'zustand';
    import {persist, createJSONStorage} from 'zustand/middleware';
    import AsyncStorage from '@react-native-async-storage/async-storage';

    // ===== тип из /client/me =====
    export type ClientMe = {
        id: number;
        phone: string;
        role: 'client' | 'washer';
        registered_at: string;
        car_number: string;
        car_body: number;
        last_wash: string | null;

        username?: string;
        brand?: number | null;
        city?: number | null;
        color?: number | null;
        car_model?: string;
        photo?: string | null;
    };


    export interface CarWashDetails {
        id: number;
        name: string;
        address: string;
        phone: string;
        latitude: number;
        longitude: number;
        washBays: number;
        workingHours: { start: string; end: string; is24Hours: boolean };
    }

    export interface CarDetails {
        ownerName: string;
        licensePlate: string;
        brand: string;
        model: string;
        bodyType: string;
        color?: string;
    }

    export interface User {
        id: string;
        phone: string;
        type: 'car-owner' | 'car-wash';
        name?: string;
        isVerified: boolean;
        password?: string;

        username?: string;
        registered_at?: string;
        last_wash?: string | null;
        car_number?: string;
        car_body?: number | string;
        brand?: number | null;
        city?: number | null;
        color?: number | null;
        car_model?: string;
        photo?: string | null;
        carDetails?: CarDetails;
        carWashDetails?: CarWashDetails;
    }


    type Nullable<T> = T | null;

    // ---------- utils для телефона ----------
    const onlyDigits = (s = '') => s.replace(/\D/g, '');

    export const normalizeKzPhone = (raw: string) => {
        // приводим к 7XXXXXXXXXX (11 цифр)
        let d = onlyDigits(raw);
        if (!d) return '';
        if (d[0] === '8') d = '7' + d.slice(1);
        if (d[0] !== '7') d = '7' + d;
        return d.slice(0, 11);
    };

    export const formatKzPhone = (digits: string) => {
        const d = onlyDigits(digits);
        if (!d) return '';
        const c = d.padEnd(11, ' ');
        const country = '+7';
        const a = c.slice(1, 4).trim();
        const b = c.slice(4, 7).trim();
        const c2 = c.slice(7, 9).trim();
        const d2 = c.slice(9, 11).trim();

        let out = country;
        if (a) out += ` (${a}`;
        if (a.length === 3) out += `)`;
        if (b) out += ` ${b}`;
        if (c2) out += ` ${c2}`;
        if (d2) out += ` ${d2}`;
        return out;
    };

    // ---------- store ----------
    type AuthState = {
        user: Nullable<User>;
        clientMe: Nullable<ClientMe>;

        setAuthUser: (u: User) => void;
        clearAuth: () => void;

        accessToken: string | null;

        setAccessToken: (t: string | null) => void;

        // raw client profile
        setClientMe: (raw: ClientMe) => void;
        clearClientMe: () => void;

        // точечные апдейтеры
        updateUser: (u: Partial<User>) => void;
        updateCarWashDetails: (d: Partial<CarWashDetails>) => void;

        // селекторы по клиенту (удобно для payload-ов)
        getClientId: () => number | null;
        getClientCarNumber: () => string;
        getClientCarBody: () => number | null;

        // телефон
        updateUserPhoneFromInput: (input: string) => void;
        getUserPhoneDigits: () => string;
        getUserPhoneFormatted: () => string;
    };

    export const useAuthStore = create<AuthState>()(
        persist(
            (set, get) => ({
                user: null,
                clientMe: null,
                accessToken: null,
                setAuthUser: (u) => set({ user: u }),
                setAccessToken: (t) => set({ accessToken: t }),

                clearAuth:   () => set({ user: null, clientMe: null, accessToken: null }),
                setClientMe: (raw) => set({ clientMe: raw }),
                clearClientMe: () => set({ clientMe: null }),

                updateUser: (u) =>
                    set((s) => (s.user ? { user: { ...s.user, ...u } } : s)),

                updateCarWashDetails: (d) =>
                    set((s) => {
                        if (!s.user || s.user.type !== 'car-wash') return s;
                        const prev = s.user.carWashDetails ?? ({} as CarWashDetails);
                        return { user: { ...s.user, carWashDetails: { ...prev, ...d } } };
                    }),

                // === селекторы по /client/me ===
                getClientId: () => {
                    const s = get();
                    if (s.clientMe?.id != null) return s.clientMe.id;
                    if (s.user?.type === 'car-owner') {
                        const n = Number(s.user.id);
                        return Number.isFinite(n) ? n : null;
                    }
                    return null;
                },

                getClientCarNumber: () => get().clientMe?.car_number ?? '',
                getClientCarBody: () => {
                    const v = get().clientMe?.car_body;
                    return typeof v === 'number' ? v : null;
                },

                // === ТЕЛЕФОН ===
                updateUserPhoneFromInput: (input: string) => {
                    const digits = normalizeKzPhone(input);
                    set((s) => (s.user ? { user: { ...s.user, phone: digits } } : s));
                },
                getUserPhoneDigits: () => {
                    const u = get().user;
                    return u?.phone ? onlyDigits(u.phone) : '';
                },
                getUserPhoneFormatted: () => {
                    const u = get().user;
                    return u?.phone ? formatKzPhone(u.phone) : '';
                },
            }),
            {
                name: 'auth-store',
                storage: createJSONStorage(() => AsyncStorage),
                version: 4,
                partialize: (s) => ({
                    user: s.user,
                    clientMe: s.clientMe,
                    accessToken: s.accessToken,
                }),
                migrate: async (persisted: any) => {
                    // Больше не удаляем accessToken: он нужен для мгновенной гидратации
                    if (persisted && typeof persisted.accessToken === 'undefined') {
                        persisted.accessToken = null;
                    }
                    return persisted;
                },

            }
        )
    );
