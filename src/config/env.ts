// src/config/env.ts
const required = (name: string) => {
    const v = process.env[name]?.trim();
    if (!v) throw new Error(`[env] Missing ${name}. Add it to your .env`);
    return v;
};

const stripTrailingSlash = (u: string) => u.replace(/\/+$/, "");

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL?? "").trim()
export const GIS_API_KEY = (process.env.EXPO_PUBLIC_2GIS_API_KEY ?? "").trim();
