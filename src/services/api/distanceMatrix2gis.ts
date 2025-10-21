// src/services/api/distanceMatrix2gis.ts
import { GIS_API_KEY } from "@/src/config/env";

export type MatrixPoint = { lat: number; lon: number; id?: string };

export type TravelInfo = {
    distanceMeters: number;
    travelTimeSec: number;
};

export async function fetch2gisMatrix(
    origin: MatrixPoint,
    destinations: MatrixPoint[],
): Promise<Record<string, TravelInfo>> {
    if (!GIS_API_KEY || destinations.length === 0) return {};

    try {
        const chunkSize = 25;
        const chunks: MatrixPoint[][] = [];
        for (let i = 0; i < destinations.length; i += chunkSize) {
            chunks.push(destinations.slice(i, i + chunkSize));
        }

        const out: Record<string, TravelInfo> = {};

        for (const chunk of chunks) {
            const body = {
                origins: [{ lat: origin.lat, lon: origin.lon }],
                destinations: chunk.map((d) => ({ lat: d.lat, lon: d.lon })),
                mode: 'auto',
            };

            const res = await fetch('https://routing.api.2gis.com/matrix/6.0.0', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': GIS_API_KEY,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                console.warn('2GIS matrix error', await res.text());
                continue;
            }

            const json = await res.json();
            const row = json?.rows?.[0];
            const elements = row?.elements ?? [];
            elements.forEach((el: any, idx: number) => {
                const dest = chunk[idx];
                if (!dest) return;
                const id = dest.id ?? `${dest.lat},${dest.lon}`;
                const distanceMeters = el?.distance?.value;
                const travelTimeSec = el?.duration?.value;
                if (typeof distanceMeters === 'number' && typeof travelTimeSec === 'number') {
                    out[id] = { distanceMeters, travelTimeSec };
                }
            });
        }

        return out;
    } catch (e) {
        console.warn('2GIS matrix exception', e);
        return {};
    }
}
