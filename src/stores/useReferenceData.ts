import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from "@/src/config/env";

type CarBody = { id: number; name: string };
type ExtraService = { id: number; name: string };

type ReferenceState = {
    carBodyTypes: CarBody[];
    extraServices: ExtraService[];
    loading: boolean;
    error: string | null;
    load: (accessToken?: string | null) => Promise<void>;
};

export const useReferenceData = create<ReferenceState>()(
    devtools(
        (set) => ({
            carBodyTypes: [],
            extraServices: [],
            loading: false,
            error: null,

            load: async (accessToken) => {
                set({ loading: true, error: null });
                try {
                    const res = await fetch(`${API_BASE_URL}/dashboard/reference-data/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        },
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json: {
                        extra_services: { service_id: number; service_name: string }[];
                        car_body_types: { body_id: number; name: string }[];
                    } = await res.json();

                    // нормализуем под UI: name — подпись, id — значение
                    const carBodyTypes: CarBody[] =
                        (json.car_body_types || []).map((b) => ({ id: b.body_id, name: b.name }));

                    const extraServices: ExtraService[] =
                        (json.extra_services || []).map((s) => ({ id: s.service_id, name: s.service_name }));

                    set({ carBodyTypes, extraServices, loading: false });
                } catch (e: any) {
                    set({ error: e?.message ?? 'Failed to load reference data', loading: false });
                }
            },
        }),
        { name: 'ReferenceDataStore' }
    )
);
