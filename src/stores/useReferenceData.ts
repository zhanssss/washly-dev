import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from "@/contexts/AuthContext";


type CarBody = { id: number; name: string };
type ExtraService = { id: number; name: string };

type ReferenceState = {
    carBodyTypes: CarBody[];
    extraServices: ExtraService[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
};

export const useReferenceData = create<ReferenceState>()(
    devtools(
        (set) => ({
            carBodyTypes: [],
            extraServices: [],
            loading: false,
            error: null,

            load: async () => {
                set({ loading: true, error: null });
                try {
                    const { data: json } = await api.get<{
                        extra_services: { service_id: number; service_name: string }[];
                        car_body_types: { body_id: number; name: string }[];
                    }>("/dashboard/reference-data/");

                    // нормализуем под UI: name — подпись, id — значение
                    const carBodyTypes: CarBody[] =
                        (json.car_body_types || []).map((b: { body_id: number; name: string; }) => ({ id: b.body_id, name: b.name }));

                    const extraServices: ExtraService[] =
                        (json.extra_services || []).map((s: { service_id: number; service_name: string; }) => ({ id: s.service_id, name: s.service_name }));

                    set({ carBodyTypes, extraServices, loading: false });
                } catch (e: any) {
                    set({ error: e?.message ?? 'Failed to load reference data', loading: false });
                }
            },
        }),
        { name: 'ReferenceDataStore' }
    )
);
