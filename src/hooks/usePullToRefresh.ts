import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type Refetcher = () => Promise<any> | void;

export function usePullToRefresh(refetchers: Refetcher[] = []) {
    const qc = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                // прицельно инвалидируем список активных броней
                qc.invalidateQueries({ queryKey: ['cw-active-bookings'], refetchType: 'active' }),
                // твои ручные рефетчи
                ...refetchers.map(fn => Promise.resolve(fn())),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [qc, refetchers]);

    return { refreshing, onRefresh };
}
