// src/services/api/exportsApi.ts
import { API_BASE_URL } from '@/src/config/env';

export type StatsKind = 'day' | 'week' | 'month' | 'year' | 'custom';
export type ExportFormat = 'xlsx' | 'pdf';

export function buildStatsExportUrl(p: {
    kind: StatsKind;
    start?: string;
    end?: string;
    year?: number;        // ← добавили
    format?: ExportFormat;
}) {
    const qs = new URLSearchParams({
        export: p.format ?? 'xlsx',
        kind: p.kind,
    });

    if (p.kind === 'custom') {
        if (!p.start || !p.end) throw new Error('start/end required for custom export');
        qs.set('start', p.start);
        qs.set('end', p.end);
    } else if (p.kind === 'year') {
        qs.set('year', String(p.year ?? new Date().getFullYear()));  // явный год
    }

    return `${API_BASE_URL}/dashboard/stats/export/?${qs.toString()}`;
}
