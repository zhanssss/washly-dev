// components/contexts/AuthContext.tsx


import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect, useCallback, useMemo} from 'react';
import {router} from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { API_BASE_URL } from '@/src/config/env';

export interface CarDetails {
    ownerName: string;
    licensePlate: string;
    brand: string;
    model: string;
    bodyType: string;
    color?: string;
}

type ClientMe = {
    id: number;
    phone: string;
    role: 'client' | 'washer';
    registered_at: string;
    car_number: string;
    car_body: string;     // приходит строкой "2"
    last_wash: string | null;
};
export interface CarWashDetails {
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    washBays: number;
    open_time: string;
    workingHours: {
        start: string;
        end: string;
        is24Hours: boolean;
    };
}

export interface User {
    id: string;
    phone: string;
    type: 'car-owner' | 'car-wash';
    name?: string;
    isVerified: boolean;
    password?: string;
    carDetails?: CarDetails;
    carWashDetails?: CarWashDetails;
}

// AuthContext.tsx
export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
});

const REFRESH_URL = `${API_BASE_URL}/api/auth/token/refresh/`;
const CLIENT_ME_URL = '/client/me/';
const WASHER_ME_URL = '/washer/me/';



export const [AuthProvider, useAuth] = createContextHook(() => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [pendingPhone, setPendingPhone] = useState<string>('');
    const [userType, setUserType] = useState<'car-owner' | 'car-wash'>('car-owner');
    const [showCode, setShowCode] = useState<boolean>(false);
    const [needsCarDetails, setNeedsCarDetails] = useState<boolean>(false);
    const [needsCarWashDetails, setNeedsCarWashDetails] = useState<boolean>(false);
    const [authStep, setAuthStep] = useState<'choice' | 'phone' | 'code' | 'details' | 'complete'>('choice');
    const [currentVerificationCode, setCurrentVerificationCode] = useState<string>('');
    const [tempPhone, setTempPhone] = useState<string>('');
    const [tempCarBody, setTempCarBody] = useState<string>('');

    const [tempPassword, setTempPassword] = useState<string>(''); // временно сохраняем пароль
    const [tempName, setTempName] = useState<string>('');        // имя пользователя
    const [tempCarNumber, setTempCarNumber] = useState<string>(''); // гос номер машины
    const [tempCarMark, setTempCarMark] = useState<string>('');     // марка машины

    const saveTempName = useCallback((name: string) => {
        setTempName(name);
    }, []);

    const saveTempCarNumber = useCallback((num: string) => {
        setTempCarNumber(num);
    }, []);

    const saveTempCarMark = useCallback((mark: string) => {
        setTempCarMark(mark);
    }, []);

    const saveTempPhone = useCallback((phone: string) => {
        setTempPhone(phone);
    }, []);

    const saveTempCarBody = useCallback((body: string) => {
        setTempCarBody(body);
    }, []);

    const saveTempPassword = useCallback((password: string) => {
        setTempPassword(password);
    }, []);

    const loadAuth = useCallback(async () => {
        try {
            const [acc, refFromSecure, refFromAsync, userData] = await Promise.all([
                AsyncStorage.getItem('accessToken'),
                // Web-guard: SecureStore на web может быть no-op
                Platform.OS !== 'web' ? SecureStore.getItemAsync('refreshToken') : Promise.resolve(null),
                AsyncStorage.getItem('refreshToken'),
                AsyncStorage.getItem('user'),
            ]);

            const ref = refFromSecure ?? refFromAsync;

            if (acc) {
                setAccessToken(acc);
                api.defaults.headers.common['Authorization'] = `Bearer ${acc}`;
            }
            if (ref) setRefreshToken(ref);
            if (userData) setUser(JSON.parse(userData));
        } catch (e) {
            console.log('Error loading auth:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAuth();
    }, [loadAuth]);


    const saveTokens = useCallback(async (access?: string | null, refresh?: string | null) => {
        console.log('[AUTH] saveTokens called', {hasAccess: !!access, hasRefresh: !!refresh});
        const store = useAuthStore.getState();

        if (access) {
            console.log('[AUTH] access token (first 24):', access.slice(0, 24));
            setAccessToken(access);
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            await AsyncStorage.setItem('accessToken', access);
            store.setAuth({ accessToken: access }); // 👈 в zustand
        }

        if (refresh) {
            setRefreshToken(refresh);
            store.setAuth({ refreshToken: refresh }); // 👈 в zustand
            try {
                if (Platform.OS !== 'web') {
                    await SecureStore.setItemAsync('refreshToken', refresh);
                } else {
                    await AsyncStorage.setItem('refreshToken', refresh);
                }
            } catch (e) {
                await AsyncStorage.setItem('refreshToken', refresh);
            }
        }
    }, []);

    const clearTokens = useCallback(async () => {
        const store = useAuthStore.getState();
        setAccessToken(null);
        setRefreshToken(null);
        store.setAuth({ accessToken: null, refreshToken: null }); // 👈 очистка в zustand

        delete api.defaults.headers.common['Authorization'];
        await AsyncStorage.removeItem('accessToken');

        try {
            if (Platform.OS !== 'web') {
                await SecureStore.deleteItemAsync('refreshToken');
            }
        } catch {}
        await AsyncStorage.removeItem('refreshToken');
    }, []);


    // всегда подставляем актуальный access в запросы
    useEffect(() => {
        const reqId = api.interceptors.request.use((config) => {
            if (accessToken) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        });
        return () => {
            api.interceptors.request.eject(reqId);
        };
    }, [accessToken]);

// общий авто-рефреш по 401
    useEffect(() => {
        let isRefreshing = false;
        let queue: Array<(t: string) => void> = [];

        const onRefreshed = (t: string) => {
            queue.forEach(cb => cb(t));
            queue = [];
        };
        const addToQueue = (cb: (t: string) => void) => queue.push(cb);

        const respId = api.interceptors.response.use(
            (r) => r,
            async (error) => {
                const originalRequest = error?.config ?? {};

                if (error?.response?.status !== 401 || (originalRequest as any)._retry) {
                    return Promise.reject(error);
                }
                (originalRequest as any)._retry = true;

                if (isRefreshing) {
                    return new Promise(resolve => {
                        addToQueue((newAccess) => {
                            (originalRequest as any).headers = (originalRequest as any).headers ?? {};
                            (originalRequest as any).headers.Authorization = `Bearer ${newAccess}`;
                            resolve(api(originalRequest));
                        });
                    });
                }

                isRefreshing = true;
                try {
                    const storedRefresh = Platform.OS !== 'web'
                        ? await SecureStore.getItemAsync('refreshToken')
                        : await AsyncStorage.getItem('refreshToken');

                    if (!storedRefresh) throw new Error('No refresh token');

                    // ⚡️ Запрашиваем новый токен
                    const resp = await axios.post(REFRESH_URL, { refresh: storedRefresh });

                    const newAccess = resp.data?.access;
                    const newRefresh = resp.data?.refresh;

                    if (!newAccess) throw new Error('No access token from refresh');

                    // сохраняем оба если пришли
                    await saveTokens(newAccess, newRefresh ?? null);

                    onRefreshed(newAccess);

                    (originalRequest as any).headers = (originalRequest as any).headers ?? {};
                    (originalRequest as any).headers.Authorization = `Bearer ${newAccess}`;

                    return api(originalRequest);
                } catch (e) {
                    await clearTokens();
                    setUser(null);
                    await AsyncStorage.removeItem('user');
                    router.replace('/');
                    return Promise.reject(e);
                } finally {
                    isRefreshing = false;
                }
            }
        );

        return () => {
            api.interceptors.response.eject(respId);
        };
    }, [saveTokens, clearTokens, setUser]);

    useEffect(() => {
        // базовый адрес твоего API (тот же, что у axios: baseURL)
        const API_ORIGIN = API_BASE_URL;

        let isRefreshing = false;
        let waiters: Array<(t: string | null) => void> = [];
        const notify = (t: string | null) => { waiters.forEach(cb => cb(t)); waiters = []; };

        const getAccess = async () =>
            useAuthStore.getState().accessToken ?? (await AsyncStorage.getItem('accessToken'));

        const getRefresh = async () => {
            const inStore = useAuthStore.getState().refreshToken;
            if (inStore) return inStore;
            try {
                // на web SecureStore может быть no-op
                const secure = Platform.OS !== 'web' ? await SecureStore.getItemAsync('refreshToken') : null;
                return secure ?? (await AsyncStorage.getItem('refreshToken'));
            } catch {
                return await AsyncStorage.getItem('refreshToken');
            }
        };

        const saveTokensSilent = async (access?: string | null, refresh?: string | null) => {
            const store = useAuthStore.getState();
            if (access) {
                store.setAuth({ accessToken: access });
                await AsyncStorage.setItem('accessToken', access);
                // заодно обновим axios, чтобы следующие axios-запросы тоже были с новым токеном
                (api.defaults.headers as any).common = {
                    ...(api.defaults.headers?.common || {}),
                    Authorization: `Bearer ${access}`,
                };
            }
            if (refresh) {
                store.setAuth({ refreshToken: refresh });
                try {
                    if (Platform.OS !== 'web') await SecureStore.setItemAsync('refreshToken', refresh);
                    else await AsyncStorage.setItem('refreshToken', refresh);
                } catch {
                    await AsyncStorage.setItem('refreshToken', refresh);
                }
            }
        };

        const originalFetch = global.fetch;

        global.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
            const urlStr = typeof input === 'string' ? input : input.toString();

            // Подставляем Authorization только для запросов к нашему API
            const isApiCall =
                urlStr.startsWith(API_ORIGIN + '/api') || urlStr.startsWith(API_ORIGIN + '/driver') || urlStr.startsWith(API_ORIGIN + '/dashboard');

            // Не перехватываем сам refresh/login и OTP
            const isAuthEndpoint =
                urlStr.includes('/api/auth/token/refresh/') ||
                urlStr.includes('/api/auth/token/') ||
                urlStr.includes('/api/auth/otp/');

            let headers = new Headers(init.headers as any);

            if (isApiCall && !isAuthEndpoint && !headers.has('Authorization')) {
                const acc = await getAccess();
                if (acc) headers.set('Authorization', `Bearer ${acc}`);
            }

            // Первая попытка
            let response = await originalFetch(input, { ...init, headers });
            if (!isApiCall || isAuthEndpoint || response.status !== 401) return response;

            // === 401 на нашем API: пытаемся обновить токен и повторить ===
            // Если уже идет refresh — ждём
            if (isRefreshing) {
                await new Promise<void>(resolve => waiters.push(() => resolve()));
                // после refresh пробуем ещё раз с новым токеном
                const acc2 = await getAccess();
                const headersRetry = new Headers(init.headers as any);
                if (acc2) headersRetry.set('Authorization', `Bearer ${acc2}`);
                return originalFetch(input, { ...init, headers: headersRetry });
            }

            isRefreshing = true;
            try {
                const refresh = await getRefresh();
                if (!refresh) return response; // нечем обновиться → отдадим 401 как есть

                const refreshResp = await axios.post(REFRESH_URL, { refresh });
                const newAccess = refreshResp.data?.access;
                const newRefresh = refreshResp.data?.refresh;

                if (!newAccess) return response;

                await saveTokensSilent(newAccess, newRefresh ?? undefined);
                notify(newAccess);

                const headersRetry = new Headers(init.headers as any);
                headersRetry.set('Authorization', `Bearer ${newAccess}`);
                return originalFetch(input, { ...init, headers: headersRetry });
            } catch (e: any) {
                // ВАЖНО: не разлогиниваем на сетевой ошибке refresh.
                // Разлогин допустим только если сам refresh вернул 401/403
                const st = e?.response?.status ?? e?.status;
                if (st === 401 || st === 403) {
                    // здесь можешь вызвать clearTokens() и редирект, если хочешь
                    // await clearTokens(); router.replace('/');
                }
                notify(null);
                return response; // вернём исходный 401
            } finally {
                isRefreshing = false;
            }
        };

        return () => {
            global.fetch = originalFetch; // на размонтирование (hot reload и т.п.)
        };
    }, []);



// Отправка кода (регистрация/вход по SMS)
    const sendVerificationCode = useCallback(async (phone: string) => {
        try {
            const resp = await api.post('/auth/otp/request/', { phone });
            if (resp.data?.message) {
                setPendingPhone(phone);
                setShowCode(true);
                setAuthStep('code');
                return { success: true };
            }
            return { success: false, error: 'Не удалось отправить код' };
        } catch (e) {
            console.log('[AUTH] sendVerificationCode error:', e);
            return { success: false, error: 'Ошибка отправки кода' };
        }
    }, []);
    const verifyCode = useCallback(async (inputCode: string) => {
        try {
            const resp = await api.post('/auth/otp/verify/', { phone: pendingPhone, code: inputCode });
            if (!resp.data) return { success: false, error: 'Пустой ответ сервера' };

            const { access, refresh, user: apiUser, is_registered } = resp.data;

            if (!is_registered) {
                setPendingPhone('');
                // необязательно, но логично отметить шаг деталями
                setAuthStep('details');
                router.replace('/car-registration');
                return { success: true, isRegistered: false, user: apiUser };
            }

            if (access && refresh) {
                await saveTokens(access, refresh);
            } else {
                return { success: false, error: 'Токены не получены' };
            }
            // 2) роль
            const detectedType: 'car-owner' | 'car-wash' =
                apiUser?.role === 'washer' ? 'car-wash' : 'car-owner';
            setUserType(detectedType);

            // 3) если НЕ зарегистрирован — сразу на анкету авто


            // 4) если зарегистрирован — тянем профиль и пускаем в приложение
            if (detectedType === 'car-owner') {
                const meResp = await api.get(CLIENT_ME_URL);
                const mapped = mapOwnerMeToUser(meResp.data);
                setUser(mapped);
                useAuthStore.getState().setAuth({ user: mapped });
                await AsyncStorage.setItem('user', JSON.stringify(mapped));
                setAuthStep('complete');
                setPendingPhone('');
                router.replace('/car-owner'); // оставил твой прежний роут
            } else {
                const meResp = await api.get(WASHER_ME_URL);
                const mapped = mapWasherMeToUser(meResp.data);
                setUser(mapped);
                useAuthStore.getState().setAuth({ user: mapped });
                await AsyncStorage.setItem('user', JSON.stringify(mapped));
                setAuthStep('complete');
                setPendingPhone('');
                router.replace('/car-wash');
            }

            return { success: true, isRegistered: true, user: apiUser };
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const serverData = err.response?.data as any;
                const msg =
                    (typeof serverData === 'string' && serverData) ||
                    serverData?.error ||
                    err.message ||
                    'Неверный код или ошибка сервера';
                return { success: false, error: msg };
            }
            return { success: false, error: 'Неверный код или ошибка сервера' };
        }
    }, [pendingPhone, saveTokens]);



    // AuthContext.tsx (вверху файла, рядом с интерфейсами)
    const BODY_MAP: Record<string, string> = {
        '1': 'sedan',
        '2': 'hatchback',
        '3': 'suv',
        '4': 'wagon',      // универсал
        '5': 'coupe',
        '6': 'pickup',
        '7': 'minivan',
        // дополни/исправь под свои коды с бэка
    };

// на всякий случай — приводим к единому виду
    const toBodyName = (codeOrName: unknown) => {
        if (codeOrName == null) return '';
        const s = String(codeOrName).trim();
        // если это код, попробуем по карте
        if (BODY_MAP[s]) return BODY_MAP[s].toLowerCase();
        // если уже имя — вернём как имя
        return s.toLowerCase();
    };


    const mapOwnerMeToUser = (me: any): User => ({
        id: String(me.id),
        phone: me.phone,
        type: 'car-owner',
        isVerified: true,
        carDetails: {
            ownerName: '',
            licensePlate: me.car_number,
            brand: '',
            model: '',
            bodyType: toBodyName(me.car_body), // ← ключевая строка
        },
    });



    const mapWasherMeToUser = (me: any): User => ({
        id: String(me.id),
        phone: me.phone,
        type: 'car-wash',
        isVerified: true,
        carWashDetails: {
            name: me.name ?? '',
            address: me.address ?? '',
            phone: me.phone ?? '',
            open_time: me.open_time ?? '',
            latitude: Number(me.latitude ?? 0),
            longitude: Number(me.longitude ?? 0),
            washBays: Number(me.wash_bays ?? 0),
            workingHours: {
                start: me.working_hours?.start ?? '08:00',
                end: me.working_hours?.end ?? '22:00',
                is24Hours: Boolean(me.working_hours?.is24Hours ?? false),
            },
        },
    });

    const registerDriver = useCallback(async (payload: {
        phone: string;
        car_number: string;
        car_body: string;
    }) => {
        try {
            const resp = await api.post('/register_driver/', payload);

            // токены приходят в теле
            const {access, refresh} = resp.data || {};
            if (!access || !refresh) {
                console.log('[AUTH] registerDriver: tokens missing in response.data', resp.data);
                return {success: false, error: 'Токены не пришли в теле ответа', data: resp.data};
            }

            console.log('[AUTH] registerDriver: got tokens', {
                access: resp.data.access?.slice(0, 24),
                refresh: resp.data.refresh ? 'yes' : 'no'
            });

            await saveTokens(access, refresh);
            const meResp = await api.get('/client/me/'); // Authorization уже подставится
            const mapped = mapOwnerMeToUser(meResp.data);
            setUser(mapped);
            useAuthStore.getState().setAuth({ user: mapped });
            await AsyncStorage.setItem('user', JSON.stringify(mapped));
            router.replace('/car-owner');
            return {success: true};
        } catch (err: any) {
            console.log('[AUTH] registerDriver error:', err?.response?.data || err?.message || err);
            const errPayload = err?.response?.data || err?.message || 'Ошибка регистрации';
            return {success: false, error: errPayload};
        }
    }, [saveTokens]);


    // Регистрация владельца авто
    const completeCarOwnerRegistration = useCallback(async () => {
        const payload = {
            name: tempName,
            phone: tempPhone,
            car_number: tempCarNumber,
            car_mark: tempCarMark,
            car_body: tempCarBody,
            password: tempPassword
        };
        return await registerDriver(payload);
    }, [tempName, tempPhone, tempCarNumber, tempCarMark, tempCarBody, tempPassword, registerDriver]);

    // Регистрация автомойки
    const completeCarWashRegistration = useCallback(async (carWashDetails: CarWashDetails) => {
        try {
            const response = await api.post('/users/car-wash', {phone: pendingPhone, carWashDetails});
            if (!response.data.success) return {success: false, error: response.data.error || 'Ошибка регистрации'};

            const newUser = response.data.user as User;
            setUser(newUser);
            useAuthStore.getState().setAuth({ user: newUser });
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            setNeedsCarWashDetails(false);
            setAuthStep('complete');
            setPendingPhone('');
            return {success: true, user: newUser};
        } catch (error) {
            console.log('Error completing car wash registration:', error);
            return {success: false, error: 'Ошибка регистрации'};
        }
    }, [pendingPhone]);

    // Вход с паролем
    const loginWithPassword = useCallback(async (phone: string, password: string) => {
        try {
            const response = await api.post('/auth/token/', { phone, password });

            // токены приходят в body (или подстрахуемся заголовками)
            let { access, refresh } = response.data ?? {};
            if (!access || !refresh) {
                access  = access  ?? response.headers?.['access']  ?? response.headers?.['access-token'];
                refresh = refresh ?? response.headers?.['refresh'] ?? response.headers?.['refresh-token'];
            }
            if (!access || !refresh) {
                return { success: false, error: 'Токены не получены' };
            }

            await saveTokens(access, refresh);

            // пробуем сначала по выбранной роли (userType), потом фолбэк
            const tryFetch = async (kind: 'car-owner' | 'car-wash') => {
                if (kind === 'car-owner') {
                    const meResp = await api.get(CLIENT_ME_URL);
                    const mapped = mapOwnerMeToUser(meResp.data);
                    setUser(mapped);
                    await AsyncStorage.setItem('user', JSON.stringify(mapped));
                    useAuthStore.getState().setAuth({ user: mapped }); // 👈 сохраняем в zustand
                    setAuthStep('complete');
                    router.replace('/car-owner');
                    return { success: true, user: mapped };
                } else {
                    const meResp = await api.get(WASHER_ME_URL);
                    const mapped = mapWasherMeToUser(meResp.data);
                    setUser(mapped);
                    await AsyncStorage.setItem('user', JSON.stringify(mapped));
                    useAuthStore.getState().setAuth({ user: mapped }); // 👈 сохраняем в zustand
                    setAuthStep('complete');
                    router.replace('/car-wash');
                    return { success: true, user: mapped };
                }
            };
            const first = userType === 'car-wash' ? 'car-wash' : 'car-owner';
            const second = first === 'car-wash' ? 'car-owner' : 'car-wash';

            try {
                return await tryFetch(first);
            } catch (e1) {
                try {
                    return await tryFetch(second);
                } catch (e2) {
                    // если оба не сработали — чистим токены
                    await clearTokens();
                    return { success: false, error: 'Не удалось получить профиль' };
                }
            }
        } catch (error) {
            console.log('Error logging in with password:', error);
            return { success: false, error: 'Ошибка входа' };
        }
    }, [userType, saveTokens, clearTokens]);

    // Сброс пароля
    const sendPasswordResetCode = useCallback(async (phone: string) => {
        try {
            const response = await api.post('/auth/password/send-code', {phone});
            return {success: response.data.success, error: response.data.error};
        } catch (error) {
            console.log('Error sending password reset code:', error);
            return {success: false, error: 'Ошибка отправки кода'};
        }
    }, []);

    const verifyPasswordResetCode = useCallback(async (phone: string, code: string) => {
        try {
            const response = await api.post('/auth/password/verify-code', {phone, code});
            return {success: response.data.success, error: response.data.error};
        } catch (error) {
            console.log('Error verifying password reset code:', error);
            return {success: false, error: 'Ошибка проверки кода'};
        }
    }, []);

    const resetPassword = useCallback(async (phone: string, newPassword: string) => {
        try {
            const response = await api.post('/auth/password/reset', {phone, newPassword});
            if (!response.data.success) return {success: false, error: response.data.error || 'Ошибка сброса пароля'};
            const updatedUser = response.data.user as User;
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            return {success: true, user: updatedUser};
        } catch (error) {
            console.log('Error resetting password:', error);
            return {success: false, error: 'Ошибка сброса пароля'};
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await clearTokens();
            await AsyncStorage.removeItem('user');
            setUser(null);
            setPendingPhone('');
            setShowCode(false);
            setNeedsCarDetails(false);
            setNeedsCarWashDetails(false);
            setAuthStep('phone');
            setCurrentVerificationCode('');
            useAuthStore.getState().clearAuth();
            router.replace('/');
        } catch (error) {
            console.log('Error logging out:', error);
        }
    }, [clearTokens]);
    const contextValue = useMemo(() => ({
        user,
        setUser,
        userType,
        setUserType,
        isLoading,
        accessToken,
        refreshToken,
        sendVerificationCode,
        verifyCode,
        completeCarOwnerRegistration,
        completeCarWashRegistration,
        loginWithPassword,
        sendPasswordResetCode,
        verifyPasswordResetCode,
        resetPassword,
        logout,
        pendingPhone,
        showCode,
        needsCarDetails,
        needsCarWashDetails,
        authStep,
        currentVerificationCode,
        tempPhone,
        tempCarBody,
        tempPassword,
        saveTempPhone,
        saveTempPassword,
        saveTempCarBody,
        tempName,
        tempCarNumber,
        tempCarMark,
        saveTempName,
        saveTempCarNumber,
        saveTempCarMark,
        registerDriver,


    }), [
        user,
        setUser,
        userType,
        setUserType,
        accessToken,
        refreshToken,
        isLoading,
        sendVerificationCode,
        verifyCode,
        completeCarOwnerRegistration,
        completeCarWashRegistration,
        loginWithPassword,
        sendPasswordResetCode,
        verifyPasswordResetCode,
        resetPassword,
        logout,
        pendingPhone,
        showCode,
        needsCarDetails,
        needsCarWashDetails,
        authStep,
        currentVerificationCode,
        tempPhone,
        tempCarBody,
        tempPassword,
        saveTempPassword,
        saveTempPhone,
        saveTempCarBody,
        tempName,
        tempCarNumber,
        tempCarMark,
        saveTempName,
        saveTempCarNumber,
        saveTempCarMark,
        registerDriver,
    ]);

    return contextValue;
});
