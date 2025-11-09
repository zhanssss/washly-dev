export type LatLng = { latitude: number; longitude: number };

export const CITY_CENTER_MAP: Record<string, LatLng> = {
    aktau:     { latitude: 43.653,  longitude: 51.197 },
    aktobe:    { latitude: 50.2839, longitude: 57.1660 },
    almaty:    { latitude: 43.2383, longitude: 76.9455 },
    astana:    { latitude: 51.1694, longitude: 71.4491 },
    atyrau:    { latitude: 47.0945, longitude: 51.9233 },
    karaganda: { latitude: 49.8060, longitude: 73.0850 },
    kostanay:  { latitude: 53.2190, longitude: 63.6350 },
    pavlodar:  { latitude: 52.2870, longitude: 76.9670 },
    shymkent:  { latitude: 42.3417, longitude: 69.5901 },
    taraz:     { latitude: 42.9000, longitude: 71.3650 },
};

// имя -> центр (регистронезависимо)
export function getCenterByName(name?: string | null): LatLng | null {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    return CITY_CENTER_MAP[key] ?? null;
}
