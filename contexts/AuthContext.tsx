// components/contexts/AuthContext.tsx
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {router} from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '@/src/stores/authStore';
import { API_BASE_URL } from '@/src/config/env';
import { saveRefreshToken, loadRefreshToken, clearRefreshToken, getJwtExp, isExpiring } from '@/src/auth/token';

export interface CarDetails {
    ownerName: string;
    licensePlate: string;
    brand: string;
    model: string;
    bodyType: string;
    color?: string;
}

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

// Access держим в памяти процесса:
let accessInMemory: string | null = null;
let accessExpMs: number | null = null;
function setAccess(token: string | null) {
    accessInMemory = token;
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        accessExpMs = getJwtExp(token);
    } else {
        delete api.defaults.headers.common['Authorization'];
        accessExpMs = null;
    }
}

const BODY_MAP: Record<string, string> = {
    '1': 'sedan',
    '2': 'hatchback',
    '3': 'suv',
    '4': 'wagon',
    '5': 'coupe',
    '6': 'pickup',
    '7': 'minivan',
};

const toBodyName = (codeOrName: unknown) => {
    if (codeOrName == null) return '';
    const s = String(codeOrName).trim();
    if (BODY_MAP[s]) return BODY_MAP[s].toLowerCase();
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
        bodyType: toBodyName(me.car_body),
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


export const [AuthProvider, useAuth] = createContextHook(() => {
    const [user, setUser] = useState<User | null>(null);
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

    const [pwResetToken, setPwResetToken] = useState<string | null>(null);


    const saveTokens = useCallback(async (access?: string | null, refresh?: string | null) => {
        if (access) setAccess(access);
        if (refresh) await saveRefreshToken(refresh);
    }, []);

    const clearTokens = useCallback(async () => {
        setAccess(null);
        await clearRefreshToken();
    }, []);



    const refreshPromiseRef = useRef<Promise<string> | null>(null);

    const ensureFreshAccess = useCallback(async (): Promise<string> => {
        if (accessInMemory && !isExpiring(accessExpMs)) return accessInMemory;

        const storedRefresh = await loadRefreshToken();
        if (!storedRefresh) throw new Error('No refresh token available');

        if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = axios
                .post(REFRESH_URL, { refresh: storedRefresh })
                .then(async (resp) => {
                    const newAccess = resp.data?.access;
                    const newRefresh = resp.data?.refresh;
                    if (!newAccess) throw new Error('No access from refresh');
                    await saveTokens(newAccess, newRefresh ?? null);
                    return newAccess as string;
                })
                .finally(() => {
                    refreshPromiseRef.current = null;
                });
        }

        return refreshPromiseRef.current;
    }, [saveTokens]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored) as User;
                    if (mounted) {
                        setUser(parsed);
                        setAuthStep('complete');
                        useAuthStore.getState().setAuthUser(parsed);
                    }
                }
            } catch (error) {
                console.log('[AUTH] Failed to restore user from storage:', error);
            }

            try {
                const r = await loadRefreshToken();
                if (!r) return;

                await ensureFreshAccess();

                try {
                    const me = await api.get(CLIENT_ME_URL);
                    const mapped = mapOwnerMeToUser(me.data);
                    if (mounted) {
                        setUser(mapped);
                        setAuthStep('complete');
                        useAuthStore.getState().setAuthUser(mapped);
                        await AsyncStorage.setItem('user', JSON.stringify(mapped));
                    }
                } catch {
                    const me = await api.get(WASHER_ME_URL);
                    const mapped = mapWasherMeToUser(me.data);
                    if (mounted) {
                        setUser(mapped);
                        setAuthStep('complete');
                        useAuthStore.getState().setAuthUser(mapped);
                        await AsyncStorage.setItem('user', JSON.stringify(mapped));
                    }
                }
            } catch (error) {
                console.log('[AUTH] Failed to refresh session on start:', error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [ensureFreshAccess]);

    useEffect(() => {
        const reqId = api.interceptors.request.use(async (cfg) => {
            try {
                if (!accessInMemory || isExpiring(accessExpMs)) {
                    const t = await ensureFreshAccess();
                    cfg.headers = cfg.headers ?? {};
                    (cfg.headers as any).Authorization = `Bearer ${t}`;
                }
            } catch {
                // пустим как есть — 401 поймает response interceptor
            }
            return cfg;
        });

        const respId = api.interceptors.response.use(
            r => r,
            async (error) => {
                const original = error?.config ?? {};
                if (error?.response?.status !== 401 || (original as any)._retried) throw error;
                (original as any)._retried = true;
                try {
                    const t = await ensureFreshAccess();
                    (original as any).headers = (original as any).headers ?? {};
                    (original as any).headers.Authorization = `Bearer ${t}`;
                    return api(original);
                } catch (e) {
                    await clearTokens();
                    setUser(null);
                    await AsyncStorage.removeItem('user');
                    router.replace('/');
                    throw e;
                }
            }
        );

        return () => {
            api.interceptors.request.eject(reqId);
            api.interceptors.response.eject(respId);
        };
    }, [ensureFreshAccess, clearTokens]);



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
                await AsyncStorage.setItem('user', JSON.stringify(mapped));
                setAuthStep('complete');
                setPendingPhone('');
                router.replace('/car-owner'); // оставил твой прежний роут
            } else {
                const meResp = await api.get(WASHER_ME_URL);
                const mapped = mapWasherMeToUser(meResp.data);
                setUser(mapped);
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
                    setAuthStep('complete');
                    router.replace('/car-owner');
                    return { success: true, user: mapped };
                } else {
                    const meResp = await api.get(WASHER_ME_URL);
                    const mapped = mapWasherMeToUser(meResp.data);
                    setUser(mapped);
                    await AsyncStorage.setItem('user', JSON.stringify(mapped));
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

// 1) REQUEST: POST /api/carwash/password/reset/request/
    const sendPasswordResetCode = useCallback(async (phone: string) => {
        try {
            const res = await api.post('/carwash/password/reset/request/', { phone });
            // backend returns { message, debug_code }
            return {
                success: true,
                message: res?.data?.message ?? '',
                debug: res?.data?.debug_code ?? '',
            };
        } catch (e: any) {
            return { success: false, error: e?.response?.data?.detail || 'Ошибка отправки кода' };
        }
    }, []);

// 2) VERIFY: POST /api/carwash/password/reset/verify/
    const verifyPasswordResetCode = useCallback(async (phone: string, code: string) => {
        try {
            const res = await api.post('/carwash/password/reset/verify/', { phone, code });
            // { reset_token, ttl_minutes }
            const token = res?.data?.reset_token || null;
            const ttl = Number(res?.data?.ttl_minutes ?? 0) || null;
            if (!token) return { success: false, error: 'Токен не получен' };
            setPwResetToken(token);
            return { success: true, reset_token: token, ttl_minutes: ttl };
        } catch (e: any) {
            return { success: false, error: e?.response?.data?.detail || 'Неверный код' };
        }
    }, []);

// 3) COMPLETE: POST /api/carwash/password/reset/complete/
    const resetPassword = useCallback(async (_phone: string, newPassword: string) => {
        if (!pwResetToken) return { success: false, error: 'Нет reset_token. Сначала подтвердите код.' };
        try {
            const res = await api.post('/carwash/password/reset/complete/', {
                reset_token: pwResetToken,
                new_password: newPassword,
                confirm_password: newPassword,
            });
            // cleanup
            setPwResetToken(null);
            return { success: true, message: res?.data?.message || 'Пароль сброшен' };
        } catch (e: any) {
            return { success: false, error: e?.response?.data?.detail || 'Не удалось изменить пароль' };
        }
    }, [pwResetToken]);


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
