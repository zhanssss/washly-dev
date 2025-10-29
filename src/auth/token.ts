// src/auth/token.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob } from 'base-64';

const KEY_REFRESH = 'refreshToken_v2';

export async function saveRefreshToken(refresh: string) {
    try {
        if (Platform.OS !== 'web') await SecureStore.setItemAsync(KEY_REFRESH, refresh);
        else await AsyncStorage.setItem(KEY_REFRESH, refresh);
    } catch {
        await AsyncStorage.setItem(KEY_REFRESH, refresh);
    }
}

export async function loadRefreshToken() {
    try {
        if (Platform.OS !== 'web') {
            const t = await SecureStore.getItemAsync(KEY_REFRESH);
            if (t) return t;
        }
        return await AsyncStorage.getItem(KEY_REFRESH);
    } catch {
        return await AsyncStorage.getItem(KEY_REFRESH);
    }
}

export async function clearRefreshToken() {
    try {
        if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(KEY_REFRESH);
    } catch {}
    await AsyncStorage.removeItem(KEY_REFRESH);
}

// exp из JWT (ms since epoch). Если access не JWT — вернёт null.
export function getJwtExp(jwt?: string | null): number | null {
    if (!jwt) return null;
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    try {
        // base64url -> base64
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        // паддинг до кратности 4
        while (b64.length % 4) b64 += '=';

        const payloadJson = atob(b64);
        const payload = JSON.parse(payloadJson);
        return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

export function isExpiring(expMs: number | null, skewMs = 90_000) {
    if (!expMs) return false;
    return Date.now() + skewMs >= expMs;
}
