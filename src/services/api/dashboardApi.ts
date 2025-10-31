// src/services/api/dashboardApi.ts
import axios from "axios";
import { API_BASE_URL } from "@/src/config/env";

export type DashboardStatic = {
    today_visits: number;
    avg_daily_visits: number;
    today_load_percent: number;
    avg_daily_load_percent: number;
};

export type DashboardBoxStat = {
    box_id: number;
    box_name: string;
    visits: number;
    revenue: string; // decimal строкой
};

export type DashboardRange = {
    range: { kind: "day" | "week" | "month" | "year" | "custom"; start: string; end_inclusive: string };
    filters?: {
        payment_method: "cash" | "card" | "online" | null;
        include_unpaid: boolean;
        box_ids: number[] | null;
    } | null;
    visits: number;
    revenue: string;     // decimal строкой
    load_percent: number;
    boxes?: DashboardBoxStat[];
};

export type DashboardStatsResponse = [DashboardStatic, DashboardRange];

type Params = {
    preset?: "this-month" | "today" | "yesterday";
    kind?: "day" | "week" | "month" | "year" | "custom";
    date?: string;
    year?: number;
    month?: number;
    start?: string; // YYYY-MM-DD
    end?: string;   // YYYY-MM-DD
    days?: number;
    avg_mode?: "active" | "calendar";
    payment_method?: "cash" | "card" | "online" | null;
    include_unpaid?: boolean;
    box_ids?: number[];
};

export async function fetchDashboardStats(token: Params | { preset: string }, params?: Params) {
    const res = await axios.get<DashboardStatsResponse>(`${API_BASE_URL}/dashboard/stats/`, {
        headers: { Authorization: `Bearer ${token}` },
        // было: params ?? { preset: "today" }
        params: params ?? { kind: "day" },
    });
    return res.data;
}
