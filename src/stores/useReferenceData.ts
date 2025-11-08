import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";
import { api } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/src/config/env";

type CarBody = { id: number; name: string };
type ExtraService = { id: number; name: string };
type Brand = { id: number; name: string };
type City = { id: number; name: string };
type Color = { id: number; name: string; hex_code: string };

type ReferenceState = {
    carBodyTypes: CarBody[];
    extraServices: ExtraService[];
    brands: Brand[];
    cities: City[];
    colors: Color[];
    loading: boolean;
    error: string | null;
    load: (token?: string | null) => Promise<void>;
};

export const useReferenceData = create<ReferenceState>()(
    devtools(
        (set) => ({
            carBodyTypes: [],
            extraServices: [],
            brands: [],
            cities: [],
            colors: [],
            loading: false,
            error: null,

            load: async (token?: string | null) => {
                set({ loading: true, error: null });
                try {
                    const [brandsRes, colorsRes, citiesRes, carBodyRes] = await Promise.all([
                        axios.get(`${API_BASE_URL}/api/brands/`),
                        axios.get(`${API_BASE_URL}/api/colors/`),
                        axios.get(`${API_BASE_URL}/api/cities/`),
                        axios.get(`${API_BASE_URL}/api/car_body/`),
                    ]);

                    console.log("carBodyRes.data:", carBodyRes.data);
                    console.log("carBodyRes.status:", carBodyRes.status);

                    const brands: Brand[] = (Array.isArray(brandsRes.data) ? brandsRes.data : []).map(
                        (b: { id: number; name: string }) => ({
                            id: b.id,
                            name: b.name,
                        })
                    );

                    const colors: Color[] = (colorsRes.data.results || []).map(
                        (c: { id: number; name: string; hex_code: string }) => ({
                            id: c.id,
                            name: c.name,
                            hex_code: c.hex_code,
                        })
                    );

                    const cities: City[] = (citiesRes.data.results || []).map(
                        (c: { id: number; name: string }) => ({
                            id: c.id,
                            name: c.name,
                        })
                    );

                    const carBodyTypes: CarBody[] = (carBodyRes.data.car_body_type || []).map(
                        (b: { body_id: number; name: string }) => ({
                            id: b.body_id,
                            name: b.name,
                        })
                    );

                    // Авторизованный запрос — extraServices
                    const { data: refJson } = await axios.get(`${API_BASE_URL}/dashboard/reference-data/`);

                    const extraServices: ExtraService[] = (refJson.extra_services || []).map(
                        (s: { service_id: number; service_name: string }) => ({
                            id: s.service_id,
                            name: s.service_name,
                        })
                    );

                    set({
                        brands,
                        colors,
                        cities,
                        carBodyTypes,
                        extraServices,
                        loading: false,
                    });
                } catch (e: any) {
                    console.error("❌ Reference load error:", e?.response?.data || e?.message);
                    set({
                        error: e?.message ?? "Failed to load reference data",
                        loading: false,
                    });
                }
            },
        }),
        { name: "ReferenceDataStore" }
    )
);
