// components/contexts/AuthContext.tsx
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect, useCallback, useMemo} from 'react';
import {router} from 'expo-router';
import axios from 'axios';
import {useAuthStore} from '@/src/stores/authStore';
import {API_BASE_URL} from '@/src/config/env';
import {
    saveRefreshToken,
    loadRefreshToken,
    clearRefreshToken,
    getJwtExp,
    isExpiring,
    saveUserSnapshot,
    loadUserSnapshot,
    saveAccessToken,
    loadAccessToken,
} from '@/src/auth/token';

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
    car_body: number;
    last_wash: string | null;
};

export interface CarWashDetails {
    id: number;
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

    username?: string;
    registered_at?: string;
    last_wash?: string | null;
    car_number?: string;
    car_body?: number | string;
    brand?: number | null;
    city?: number | null;
    color?: number | null;
    car_model?: string;

    carDetails?: CarDetails;
    carWashDetails?: CarWashDetails;
}
// AuthContext.tsx
export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
});

export const dashboardApi = axios.create({
    baseURL: `${API_BASE_URL}/dashboard`,
    timeout: 10000,
});

export const driverApi = axios.create({
    baseURL: `${API_BASE_URL}/driver`,
    timeout: 10000,
});

const REFRESH_URL = `${API_BASE_URL}/api/auth/token/refresh/`;
const CLIENT_ME_URL = '/client/me/';
const WASHER_ME_URL = '/washer/me/';
// Access держим в памяти процесса:
let accessInMemory: string | null = null;
let accessExpMs: number | null = null;

// AuthContext.tsx — внутри setAccess заменить на установку заголовков для всех инстансов
function applyAuthHeaders(instance: typeof api, token: string | null) {
    if (token) {
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        (instance.defaults.headers.common as any)['Auth-token'] = token; // для бэков, где ждут этот хедер
    } else {
        delete instance.defaults.headers.common['Authorization'];
        delete (instance.defaults.headers.common as any)['Auth-token'];
    }
}

function setAccess(token: string | null) {
    accessInMemory = token;
    const setAccessToken = useAuthStore.getState().setAccessToken;
    setAccessToken(token);

    applyAuthHeaders(api, token);
    applyAuthHeaders(dashboardApi, token);
    applyAuthHeaders(driverApi, token);

    accessExpMs = token ? getJwtExp(token) : null;
}




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

    const [pwResetDebugCode, setPwResetDebugCode] = useState<string | null>(null);
    const [pwResetVerifiedCode, setPwResetVerifiedCode] = useState<string | null>(null);
    const [pwResetToken, setPwResetToken] = useState<string | null>(null);
    const [pwResetTTL, setPwResetTTL] = useState<number | null>(null); // minutes


    // Вверху файла добавь получение методов стора:
    const { setAuthUser: setAuthUserStore, setClientMe, clearClientMe } = useAuthStore.getState();

    // AuthContext.tsx — общий помощник для навешивания интерсепторов на любой инстанс



    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const snap = await loadUserSnapshot<User>();
                if (snap && mounted) {
                    setUser(snap);
                }

                // ⬇️ ДОБАВЬ БЛОК МГНОВЕННОЙ ГИДРАТАЦИИ ACCESS
                // 1) достаём access из AsyncStorage (или из персист-стора)
                let hydratedAccess = await loadAccessToken();
                if (!hydratedAccess) {
                    const fromStore = useAuthStore.getState().accessToken; // zustand-persist
                    if (fromStore) hydratedAccess = fromStore;
                }
                // 2) если есть и не истекает — настраиваем axios/память
                if (hydratedAccess) {
                    const exp = getJwtExp(hydratedAccess);
                    if (!isExpiring(exp)) {
                        setAccess(hydratedAccess);
                    }
                }

                const r = await loadRefreshToken();
                if (!r) {
                    // refresh нет — но если setAccess выше уже сработал, попробуем дернуть /me
                    if (accessInMemory) {
                        try {
                            const me = await api.get(CLIENT_ME_URL);
                            const mapped = mapOwnerMeToUser(me.data);
                            if (mounted) {
                                setUser(mapped);
                                await saveUserSnapshot(mapped);
                                setAuthUserStore(mapped);
                                setClientMe(me.data);
                            }
                        } catch {
                            try {
                                const me2 = await api.get(WASHER_ME_URL);
                                const mapped2 = mapWasherMeToUser(me2.data);
                                if (mounted) {
                                    setUser(mapped2);
                                    await saveUserSnapshot(mapped2);
                                    setAuthUserStore(mapped2);
                                    clearClientMe();
                                }
                            } catch { /* останемся неавторизованы */
                            }
                        }
                    }
                    return; // ⬅️ важный ранний выход: не трогаем refresh-логику ниже
                }

                // Был refresh → обычный поток: получим свежий access и затем /me
                await ensureFreshAccess();
                try {
                    const me = await api.get(CLIENT_ME_URL);
                    const mapped = mapOwnerMeToUser(me.data);
                    if (mounted) {
                        setUser(mapped);
                        await saveUserSnapshot(mapped);
                    }
                } catch {
                    const me = await api.get(WASHER_ME_URL);
                    const mapped = mapWasherMeToUser(me.data);
                    if (mounted) {
                        setUser(mapped);
                        await saveUserSnapshot(mapped);
                    }
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);


    const saveTokens = useCallback(async (access?: string | null, refresh?: string | null) => {
        if (access) setAccess(access);
        if (typeof access !== 'undefined') {
            await saveAccessToken(access); // null → удалит, string → сохранит
        }
        if (refresh) await saveRefreshToken(refresh);
    }, []);

    const clearTokens = useCallback(async () => {
        setAccess(null);
        await clearRefreshToken();
    }, []);


    let refreshPromise: Promise<string> | null = null;

    async function ensureFreshAccess(): Promise<string> {
        if (accessInMemory && !isExpiring(accessExpMs)) return accessInMemory;

        const storedRefresh = await loadRefreshToken();
        if (!storedRefresh) throw new Error('No refresh');

        if (!refreshPromise) {
            refreshPromise = axios.post(REFRESH_URL, {refresh: storedRefresh})
                .then(async (resp) => {
                    const newAccess = resp.data?.access;
                    const newRefresh = resp.data?.refresh; // если бэк ротирует refresh
                    if (!newAccess) throw new Error('No access from refresh');
                    await saveTokens(newAccess, newRefresh ?? null);
                    return newAccess as string;
                })
                .finally(() => {
                    refreshPromise = null;
                });
        }
        return await refreshPromise!;
    }

    function attachAuthInterceptors(instance: typeof api) {
        const reqId = instance.interceptors.request.use(async (cfg) => {
            try {
                if (!accessInMemory || isExpiring(accessExpMs)) {
                    const t = await ensureFreshAccess();
                    cfg.headers = cfg.headers ?? {};
                    (cfg.headers as any).Authorization = `Bearer ${t}`;
                    (cfg.headers as any)['Auth-token'] = t;
                }
            } catch {
                // пустим как есть
            }
            return cfg;
        });

        const respId = instance.interceptors.response.use(
            r => r,
            async (error) => {
                const original = error?.config ?? {};
                if (error?.response?.status !== 401 || (original as any)._retried) throw error;
                (original as any)._retried = true;
                try {
                    const t = await ensureFreshAccess();
                    (original as any).headers = (original as any).headers ?? {};
                    (original as any).headers.Authorization = `Bearer ${t}`;
                    (original as any).headers['Auth-token'] = t;
                    return instance(original);
                } catch (e) {
                    await clearTokens();
                    setUser(null);
                    await AsyncStorage.removeItem('user');
                    router.replace('/map');
                    throw e;
                }
            }
        );

        return () => {
            instance.interceptors.request.eject(reqId);
            instance.interceptors.response.eject(respId);
        };
    }

    useEffect(() => {
        const ejectApi = attachAuthInterceptors(api);
        const ejectDashboard = attachAuthInterceptors(dashboardApi);
        const ejectDriver = attachAuthInterceptors(driverApi);

        return () => {
            ejectApi();
            ejectDashboard();
            ejectDriver();
        };
    }, [saveTokens, clearTokens]);





// Отправка кода (регистрация/вход по SMS)
    const sendVerificationCode = useCallback(async (phone: string) => {
        try {
            const resp = await api.post('/auth/otp/request/', {phone});
            if (resp.data?.message) {
                setPendingPhone(phone);
                setShowCode(true);
                setAuthStep('code');
                return {success: true};
            }
            return {success: false, error: 'Не удалось отправить код'};
        } catch (e) {
            console.log('[AUTH] sendVerificationCode error:', e);
            return {success: false, error: 'Ошибка отправки кода'};
        }
    }, []);
    const verifyCode = useCallback(async (inputCode: string) => {
        try {
            const resp = await api.post('/auth/otp/verify/', {phone: pendingPhone, code: inputCode});
            if (!resp.data) return {success: false, error: 'Пустой ответ сервера'};

            const {access, refresh, user: apiUser, is_registered} = resp.data;

            if (!is_registered) {
                setPendingPhone('');
                // необязательно, но логично отметить шаг деталями
                setAuthStep('details');
                router.replace('/car-registration');
                return {success: true, isRegistered: false, user: apiUser};
            }

            if (access && refresh) {
                await saveTokens(access, refresh);
            } else {
                return {success: false, error: 'Токены не получены'};
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
                await saveUserSnapshot(mapped);
                setAuthUserStore(mapped);
                setClientMe(meResp.data);
                setAuthStep('complete');
                setPendingPhone('');
                router.replace('/car-owner'); // оставил твой прежний роут
            } else {
                const meResp = await api.get(WASHER_ME_URL);
                const mapped = mapWasherMeToUser(meResp.data);
                setUser(mapped);
                await saveUserSnapshot(mapped);
                setAuthUserStore(mapped);
                clearClientMe();
                setAuthStep('complete');
                setPendingPhone('');
                router.replace('/car-wash');
            }

            return {success: true, isRegistered: true, user: apiUser};
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const serverData = err.response?.data as any;
                const msg =
                    (typeof serverData === 'string' && serverData) ||
                    serverData?.error ||
                    err.message ||
                    'Неверный код или ошибка сервера';
                return {success: false, error: msg};
            }
            return {success: false, error: 'Неверный код или ошибка сервера'};
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

        // плоские поля как есть из /client/me
        username: me.username,
        registered_at: me.registered_at,
        last_wash: me.last_wash ?? null,
        car_number: me.car_number,
        car_body: me.car_body,     // может быть "2" строкой
        brand: me.brand ?? null,
        city: me.city ?? null,
        color: me.color ?? null,
        car_model: me.car_model ?? '',

        // совместимость со старым UI
        carDetails: {
            ownerName: '',
            licensePlate: me.car_number,
            brand: '',   // при желании можешь подтянуть имя бренда из справочника
            model: me.car_model ?? '',
            bodyType: toBodyName(me.car_body),
            // color: — имя, если понадобится, можно сопоставить из справочника
        },
    });


    const mapWasherMeToUser = (me: any): User => ({
        id: String(me.id),
        phone: me.phone,
        type: 'car-wash',
        isVerified: true,
        carWashDetails: {
            id: me.car_id,
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
            const meResp = await api.get('/client/me/');
            const mapped = mapOwnerMeToUser(meResp.data);
            setUser(mapped);
            await saveUserSnapshot(mapped);
            setAuthUserStore(mapped);
            setClientMe(meResp.data);
            router.replace('/map');
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
            const response = await api.post('/auth/token/', {phone, password});

            // токены приходят в body (или подстрахуемся заголовками)
            let {access, refresh} = response.data ?? {};
            if (!access || !refresh) {
                access = access ?? response.headers?.['access'] ?? response.headers?.['access-token'];
                refresh = refresh ?? response.headers?.['refresh'] ?? response.headers?.['refresh-token'];
            }
            if (!access || !refresh) {
                return {success: false, error: 'Токены не получены'};
            }

            await saveTokens(access, refresh);

            // пробуем сначала по выбранной роли (userType), потом фолбэк
            const tryFetch = async (kind: 'car-owner' | 'car-wash') => {
                if (kind === 'car-owner') {
                    const meResp = await api.get(CLIENT_ME_URL);
                    const mapped = mapOwnerMeToUser(meResp.data);
                    setUser(mapped);
                    await saveUserSnapshot(mapped);
                    setAuthUserStore(mapped);
                    setClientMe(meResp.data);
                    setAuthStep('complete');
                    router.replace('/car-owner');
                    return { success: true, user: mapped };

                } else {
                    const meResp = await api.get(WASHER_ME_URL);
                    const mapped = mapWasherMeToUser(meResp.data);
                    setUser(mapped);
                    await saveUserSnapshot(mapped);
                    setAuthUserStore(mapped);
                    clearClientMe();
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
                    return {success: false, error: 'Не удалось получить профиль'};
                }
            }
        } catch (error) {
            console.log('Error logging in with password:', error);
            return {success: false, error: 'Ошибка входа'};
        }
    }, [userType, saveTokens, clearTokens]);

// 1) REQUEST: POST /api/carwash/password/reset/request/
    const sendPasswordResetCode = useCallback(async (phone: string) => {
        try {
            const res = await api.post('/carwash/password/reset/request/', {phone});
            // backend returns { message, debug_code }
            return {
                success: true,
                message: res?.data?.message ?? '',
                debug: res?.data?.debug_code ?? '',
            };
        } catch (e: any) {
            return {success: false, error: e?.response?.data?.detail || 'Ошибка отправки кода'};
        }
    }, []);

// 2) VERIFY: POST /api/carwash/password/reset/verify/
    const verifyPasswordResetCode = useCallback(async (phone: string, code: string) => {
        try {
            const res = await api.post('/carwash/password/reset/verify/', {phone, code});
            // { reset_token, ttl_minutes }
            const token = res?.data?.reset_token || null;
            const ttl = Number(res?.data?.ttl_minutes ?? 0) || null;
            if (!token) return {success: false, error: 'Токен не получен'};
            setPwResetToken(token);
            setPwResetTTL(ttl);
            return {success: true, reset_token: token, ttl_minutes: ttl};
        } catch (e: any) {
            return {success: false, error: e?.response?.data?.detail || 'Неверный код'};
        }
    }, []);

// 3) COMPLETE: POST /api/carwash/password/reset/complete/
    const resetPassword = useCallback(async (_phone: string, newPassword: string) => {
        if (!pwResetToken) return {success: false, error: 'Нет reset_token. Сначала подтвердите код.'};
        try {
            const res = await api.post('/carwash/password/reset/complete/', {
                reset_token: pwResetToken,
                new_password: newPassword,
                confirm_password: newPassword,
            });
            // cleanup
            setPwResetToken(null);
            setPwResetTTL(null);
            return {success: true, message: res?.data?.message || 'Пароль сброшен'};
        } catch (e: any) {
            return {success: false, error: e?.response?.data?.detail || 'Не удалось изменить пароль'};
        }
    }, [pwResetToken]);


    const logout = useCallback(async () => {
        try {
            await clearTokens();
            await saveUserSnapshot(null);
            await saveAccessToken(null);
            setUser(null);
            setPendingPhone('');
            setShowCode(false);
            setNeedsCarDetails(false);
            setNeedsCarWashDetails(false);
            setAuthStep('phone');
            setCurrentVerificationCode('');
            useAuthStore.getState().clearAuth();
            useAuthStore.getState().setAccessToken(null);
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
