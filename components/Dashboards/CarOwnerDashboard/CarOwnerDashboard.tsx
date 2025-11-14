import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {scanBooking, pollSession} from '@/src/services/api/qrApi';
import {updateExtras, pay, type PollResponse} from '@/src/services/api/qrApi';
import {fetchCarWashDetail, fetchCarWashes} from '@/src/services/api/carWashesApi';
import {
    View, Text, TouchableOpacity, ScrollView, Image, Alert, TextInput, Modal, ActivityIndicator, RefreshControl
} from 'react-native';
import {usePullToRefresh} from '@/src/hooks/usePullToRefresh'
import {styles} from './CarOwnerDashboard.styles';
import {
    Map as MapIcon,
    Star, Phone, Clock, MapPin, LogOut, QrCode, BarChart3, Search, Filter,
    Trophy, Calendar, Bell, Target, Crown, User, Settings, Edit, Car,
    Shield, HelpCircle, Camera, Save, X, Trash2,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import EditProfileModal from '@/components/Modals/EditProfileModal/EditProfileModal';
import placeholderWash from '@/assets/images/placeholders/carwash_placeholder.jpg';
import OwnerHeader from '@/components/OwnerHeader/OwnerHeader';
import {api, useAuth} from '@/contexts/AuthContext';
import {useVisits} from '@/contexts/VisitsContext';
import {
    CarWash,
    fetchBoxSlots,
    fetchBoxes,
    type CarWashDetail,
    type Box,
    type BoxSlotsResponse,
} from '@/src/services/api/carWashesApi';

import type {BookingSlot} from '@/src/data/carWashes';
import {fetch2gisMatrix, TravelInfo} from '@/src/services/api/distanceMatrix2gis';
import QRScanner from '@/components/Modals/QRScanner/QRScanner';
import {router} from 'expo-router';
import {trpc} from '@/lib/trpc';
import {colors} from '@/assets/Theme/colors';

import BookingModal from "@/components/Modals/BookingModal/BookingModal";
import {useMyBookings} from '@/src/data/bookings/useMyBookings';
import type {MyBooking} from '@/src/types/bookings';
import FiltersModal from '@/components/Modals/Filter/FiltersModal';


interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'reminder' | 'booking' | 'promo';
    timestamp: Date;
    read: boolean;
}

export function CarOwnerDashboard() {
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{
        body?: string | null;
        extras?: string[];
        priceRange?: [number, number];
        sortBy?: 'distance' | 'rating' | 'price' | null;
        isOpenNow?: boolean;
        city?: string | null;
    }>({
        body: null,
        extras: [],
        priceRange: [0, 50000],
        sortBy: null,
        isOpenNow: false,
        city: null,
    });

    const [selectedFilter, setSelectedFilter] = useState<'all' | 'distance' | 'rating' | 'price'>('all');
    const [showBooking, setShowBooking] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [showNotificationsSettings, setShowNotificationsSettings] = useState(false);
    const [showSecuritySettings, setShowSecuritySettings] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [washDetail, setWashDetail] = useState<CarWashDetail | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
    const [boxSlots, setBoxSlots] = useState<BoxSlotsResponse | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const {myBookings, cancelBooking, reload} = useMyBookings();
    const {user, logout} = useAuth();
    const trpcUtils = trpc.useUtils();
    const updateOwnerMutation = trpc.profile.updateCarOwner.useMutation();
    const uploadPhotoMutation = trpc.profile.uploadPhoto.useMutation();
    const {addVisit, getUserStats} = useVisits();
    const insets = useSafeAreaInsets();
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [nextSheet, setNextSheet] = useState<null | 'editProfile'>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [carWashes, setCarWashes] = useState<CarWash[]>([]);
    const [loadingCarWashes, setLoadingCarWashes] = useState(true);
    const [carWashesError, setCarWashesError] = useState<string | null>(null);
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<number[]>([]);
    // уже есть: qrToken, qrStatus, startPoll/stopPoll, pollRef
// правильно
    const [pollInfo, setPollInfo] = useState<PollResponse | null>(null);
    const [availableByWash, setAvailableByWash] = useState<Record<string, {
        availableBoxes: number;
        totalFutureFreeSlots: number;
    }>>({});
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [qrStatus, setQrStatus] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const qrActiveRef = useRef(false);
    const stopPoll = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        qrActiveRef.current = false;
    };

    // === NEW: checkout (QR-confirmation) state
    const [qrWashDetail, setQrWashDetail] = useState<CarWashDetail | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash'); // card -> alert

    // Базовая цена для QR-потока (по bodyId пользователя, иначе минимальная)
    const getBasePriceQR = () => {
        const detail = qrWashDetail || washDetail;
        if (!detail) return 0;

        const bodyNameFromUser = user?.carDetails?.bodyType?.toLowerCase?.();
        let bodyId: number | null = selectedBodyId ?? null;

        if (!bodyId && bodyNameFromUser) {
            const found = detail.bodyPrices.find(bp => bp.bodyName.toLowerCase() === bodyNameFromUser);
            if (found) bodyId = found.bodyId;
        }
        if (!bodyId && detail.bodyPrices.length) {
            bodyId = [...detail.bodyPrices].sort((a, b) => a.price - b.price)[0].bodyId;
        }

        const bp = detail.bodyPrices.find(b => b.bodyId === bodyId);
        return bp?.price ?? 0;
    };

    const getExtrasTotalQR = () =>
        qrWashExtras
            .filter(e => selectedQrExtras.includes(e.id))
            .reduce((sum, e) => sum + (e.price || 0), 0);

// Сервисный сбор (на сейчас 0; при необходимости поменяете формулу)
    const getServiceFee = (subtotal: number) => 0;

// Итог для отображения: предпочитаем сумму с бэка, иначе рассчитываем сами
    const getGrandTotalQR = () => {
        const base = getBasePriceQR();
        const extras = getExtrasTotalQR();
        const fee = getServiceFee(base + extras);
        return base + extras + fee;
    };


    // нормализация строк (сравнение названий допов)
    const norm = (s?: string) =>
        String(s || '')
            .toLowerCase()
            .replace(/[.,;:!?()/\\\-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    const uniqNums = (arr: number[]) => Array.from(new Set(arr));

// извлечь ids допов из брони и промапить на каталог мойки
    function mapBookingExtrasToIds(booking: any, extrasCatalog: Array<{ id: number; name: string }>) {
        if (!booking || !extrasCatalog?.length) return [] as number[];

        // 1) если бэк уже отдаёт id
        const idsFromBooking = Array.isArray(booking.extra_service_ids)
            ? (booking.extra_service_ids as number[])
            : [];

        if (idsFromBooking.length) {
            const catalogIds = new Set(extrasCatalog.map(e => e.id));
            return idsFromBooking.filter(id => catalogIds.has(id));
        }

        // 2) матчим по имени (booking.extra_services может быть string[] или строка)
        const namesFromBooking: string[] =
            Array.isArray(booking.extra_services)
                ? booking.extra_services
                : typeof booking.extra_services === 'string'
                    ? booking.extra_services.split(',') // на всякий случай
                    : Array.isArray(booking.extras)
                        ? booking.extras
                        : [];

        if (!namesFromBooking.length) return [];

        const catalogByName = new Map(
            extrasCatalog.map(e => [norm(e.name), e.id])
        );

        const idsByName = namesFromBooking
            .map((n: string) => catalogByName.get(norm(n)))
            .filter((v: number | undefined): v is number => typeof v === 'number');

        return uniqNums(idsByName);
    }

    async function prefillExtrasFromBookingAndPoll({
                                                       token,
                                                       pollSelectedIds,
                                                       booking,
                                                       extrasCatalog,
                                                   }: {
        token: string;
        pollSelectedIds: number[] | undefined;
        booking: any;
        extrasCatalog: Array<{ id: number; name: string }>;
    }) {
        // ids из брони
        const fromBooking = mapBookingExtrasToIds(booking, extrasCatalog);
        // ids из poll
        const fromPoll = Array.isArray(pollSelectedIds) ? pollSelectedIds : [];

        // объединяем
        const union = uniqNums([...(fromPoll || []), ...(fromBooking || [])]);

        setSelectedQrExtras(union);

        // если в poll не совпадает с union — синхронизируем на бэк (и подтянем сумму)
        if (token && (fromPoll.length !== union.length || fromPoll.some(id => !union.includes(id)))) {
            try {
                extrasSavingRef.current = true;
                const r = await updateExtras(token, union);
                if (r?.amount_total) setQrAmount(r.amount_total);
            } catch {
            } finally {
                extrasSavingRef.current = false;
            }
        }
    }


    const refreshCarOwner = async () => {
        // 1) список моек
        try {
            const data = await fetchCarWashes();
            setCarWashes(Array.isArray(data) ? data : []);
        } catch {
        }

        // 2) доступность слотов на выбранную дату
        try {
            if (bookingDate) await loadAvailabilityForAll(carWashes, bookingDate);
        } catch {
        }

        // 3) если выбрана мойка/бокс — перезагрузим слоты модалки
        try {
            if (selectedWash && selectedBoxId) {
                const slots = await fetchBoxSlots(Number(selectedWash.id), selectedBoxId, bookingDate);
                setBoxSlots(slots);
            }
        } catch {
        }

        // 4) если идёт QR-сессия — дёрнем poll разово, чтобы обновить статус
        try {
            if (qrToken) {
                const s = await pollSession(qrToken);
                setPollInfo(s);
                setQrStatus(s?.status ?? null);
                setQrAmount(s?.amount_total ?? null);
            }
        } catch {
        }
    };

    const {refreshing, onRefresh} = usePullToRefresh([refreshCarOwner]);

    const startPoll = (token: string) => {
        stopPoll();
        qrActiveRef.current = true;

        const tick = async () => {
            if (!qrActiveRef.current) {
                stopPoll();
                return;
            }
            try {
                const s = await pollSession(token);
                if (!qrActiveRef.current) return;

                setPollInfo(s);
                setQrStatus(s.status || 'initiated');
                if (s?.amount_total) setQrAmount(s.amount_total);

                // берём выбранные допы с сервера (если не идёт локальное сохранение)
                if (Array.isArray(s?.selected_extra_ids) && !extrasSavingRef.current) {
                    setSelectedQrExtras(s.selected_extra_ids);
                }
            } catch {
            }
        };

        tick();
        pollRef.current = setInterval(tick, 1500);
    };

// рядом добавь реф для блокировки автосинка во время локального сохранения:
    const extrasSavingRef = useRef(false);
    useEffect(() => {
        if (!showProfile && nextSheet === 'editProfile') {
            setNextSheet(null);
            setShowEditProfile(true);
        }
    }, [showProfile, nextSheet]);

    useEffect(() => {
        if (showQRScanner) {
            // обновим список, чтобы сразу после создания записи QR видел её
            reload().catch(() => {
            });
        }
    }, [showQRScanner, reload]);

    useEffect(() => {
        if (!qrToken || !pollInfo) return;

        // финальные состояния — закрываем всё
        if (['paid', 'closed', 'expired'].includes(pollInfo.status)) {
            stopPoll();
            setExtrasVisible(false);
            const msg =
                pollInfo.status === 'paid'
                    ? 'Оплата прошла успешно!'
                    : pollInfo.status === 'expired'
                        ? 'QR-сессия истекла'
                        : 'Сессия завершена';
            Alert.alert('QR', msg);

            // reset
            setQrToken(null);
            setQrStatus(null);
            setPollInfo(null);
            setQrWashExtras([]);
            setSelectedQrExtras([]);
            setQrAmount(null);
            extrasOpenedFor.current = null;
            return;
        }

        // мойка ждёт выбор допов — один раз открываем модалку
        if (pollInfo?.status === 'awaiting_extras' && !extrasVisible) {
            extrasOpenedFor.current = qrToken;
            (async () => {
                try {
                    const detail = await fetchCarWashDetail(Number(pollInfo.carWashId));
                    const extras = (detail?.extraServices || []).map((e: any) => ({
                        id: e.id,
                        name: e.name,
                        price: e.price
                    }));
                    setQrWashExtras(extras);
                    const activeBooking = pickActive(myBookings);
                    await prefillExtrasFromBookingAndPoll({
                        token: qrToken!,
                        pollSelectedIds: pollInfo.selected_extra_ids,
                        booking: activeBooking,
                        extrasCatalog: extras,
                    });

                    setExtrasVisible(true);

                } catch {
                    setQrWashExtras([]);
                    setSelectedQrExtras(pollInfo.selected_extra_ids || []);
                    setExtrasVisible(true);
                }
            })();
        }
    }, [qrToken, pollInfo, myBookings]);
    const [isUpdatingExtras, setIsUpdatingExtras] = useState(false);

    const toggleQrExtra = async (id: number) => {
        if (!qrToken || isUpdatingExtras) return;

        const prev = selectedQrExtras;
        const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];

        // оптимистично
        setSelectedQrExtras(next);
        setIsUpdatingExtras(true);
        extrasSavingRef.current = true;

        try {
            const r = await updateExtras(qrToken, next);
            if (r?.amount_total) setQrAmount(r.amount_total);
        } catch (e: any) {
            // откат на предыдущее
            setSelectedQrExtras(prev);
            Alert.alert('Ошибка', e?.message ?? 'Не удалось обновить доп. услуги');
        } finally {
            setIsUpdatingExtras(false);
            extrasSavingRef.current = false;
        }
    };

    const pickActive = (list: MyBooking[]) => list.find(b => b.status === 'booked') || null;


    const handleApplyFilters = (filters: any) => {
        setActiveFilters(filters);
        setShowFilters(false);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Удалить аккаунт',
            'Это действие необратимо. Ваш профиль и данные будут удалены. Продолжить?',
            [
                {text: 'Отмена', style: 'cancel'},
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // закрыть модалку, чтобы не оставалась открытой
                            setShowProfile(false);
                            // реальный вызов удаления
                            await api.delete('/privacy/delete-my-user/');
                            Alert.alert('Готово', 'Аккаунт удалён');
                            logout();
                        } catch (e: any) {
                            Alert.alert('Ошибка', e?.message ?? 'Не удалось удалить аккаунт');
                        }
                    },
                },
            ],
        );
    };


    const handlePay = async (method: 'card' | 'cash') => {
        if (!qrToken) return;
        try {
            setIsPaying(true);
            await pay(qrToken, method);
            if (method === 'cash') {
                // сразу в UI даём понять, что ждём кассира
                setQrStatus('cash_waiting_approval');
                Alert.alert('Ожидание', 'Попросите администратора подтвердить оплату наличными.');
                // poll уже запущен; если вдруг нет — подстрахуемся
                startPoll(qrToken);
            }
        } catch (e: any) {
            Alert.alert('Ошибка', e?.message ?? 'Оплата не прошла');
        } finally {
            setIsPaying(false);
        }
    };


    useEffect(() => () => stopPoll(), []);


// модалка выбора допов
    const [extrasVisible, setExtrasVisible] = useState(false);
    const [qrWashExtras, setQrWashExtras] = useState<Array<{ id: number; name: string; price: number }>>([]);
    const [selectedQrExtras, setSelectedQrExtras] = useState<number[]>([]);
    const [qrAmount, setQrAmount] = useState<string | null>(null);
    const [isPaying, setIsPaying] = useState(false);

// чтобы не открывать модалку допов по кругу для одного токена
    const extrasOpenedFor = useRef<string | null>(null);

// подобрать bodyId из профиля, если есть
    useEffect(() => {
        if (!washDetail) return;
        // попробуем найти по названию кузова в профиле
        const bodyNameFromUser = user?.carDetails?.bodyType?.toLowerCase?.();
        if (bodyNameFromUser) {
            const found = washDetail.bodyPrices.find(
                (bp) => bp.bodyName.toLowerCase() === bodyNameFromUser
            );
            if (found) {
                setSelectedBodyId(found.bodyId);
                return;
            }
        }
        // иначе выберем самый дешевый по умолчанию
        if (washDetail.bodyPrices.length > 0) {
            const min = [...washDetail.bodyPrices].sort((a, b) => a.price - b.price)[0];
            setSelectedBodyId(min.bodyId);
        }
    }, [washDetail, user?.carDetails?.bodyType]);

    const toggleExtra = (id: number) => {
        setSelectedExtras((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleOpenBookingMap = (b: MyBooking) => {
        const cw = enhancedCarWashes.find(c => c.id === b.carWashId);
        if (cw) openMapFocused(cw);
        else Alert.alert('Карта', 'Автомойка не найдена в списке');
    };

    const handleShowBookingQR = (_b: MyBooking) => {
        setShowQRScanner(true); // позже тут покажешь QR по конкретной броне
    };


    const getBasePrice = () => {
        if (!washDetail || selectedBodyId == null) return 0;
        const bp = washDetail.bodyPrices.find((b) => b.bodyId === selectedBodyId);
        return bp?.price ?? 0;
    };

    const getExtrasTotal = () => {
        if (!washDetail) return 0;
        return washDetail.extraServices
            .filter((es) => selectedExtras.includes(es.id))
            .reduce((sum, es) => sum + es.price, 0);
    };

    const calculateTotalPrice = () => getBasePrice() + getExtrasTotal();

    const todayLocal = () => {
        const now = new Date();
        // превращаем локальное время в "локальный ISO-день" без смещения в прошлый/следующий день
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 10);
    };
    const [bookingDate, setBookingDate] = useState<string>(() => todayLocal()); // YYYY-MM-DD локально

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const data = await fetchCarWashes();
                if (mounted) setCarWashes(Array.isArray(data) ? data : []);
            } catch (e) {
                if (mounted) {
                    setCarWashesError('Не удалось загрузить список автомоек');
                    Alert.alert('Ошибка', 'Не удалось загрузить список автомоек');
                }
            } finally {
                if (mounted) setLoadingCarWashes(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);


    type EnhancedCarWash = CarWash & {
        distance: number;
        travelTimeMin?: number;
        bookingSlots: BookingSlot[];
        availableSlots: number;
        futureFreeSlots: number;
        city?: string; // 👈 добавляем, чтобы фильтровать по городу
        extraServices?: Array<{ id: number; name: string }>; // 👈 добавляем для фильтра по допам
    };


    const [travelMap, setTravelMap] = useState<Record<string, TravelInfo>>({});

    const [selectedWash, setSelectedWash] = useState<EnhancedCarWash | null>(null);
    const openBookingForWash = async (wash: EnhancedCarWash) => {
        setShowBooking(true);
        try {
            const d = await fetchCarWashDetail(Number(wash.id));
            setWashDetail(d);

            const b = Array.isArray(d.boxes) ? d.boxes : [];
            setBoxes(b);

            const firstBox = b.find(x => x.isAvailable) ?? b[0];
            if (firstBox) {
                setSelectedBoxId(firstBox.id);
                setLoadingSlots(true);
                const slots = await fetchBoxSlots(Number(wash.id), firstBox.id, bookingDate);
                setBoxSlots(slots);
            } else {
                setBoxSlots(null);
            }

        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось загрузить данные автомойки');
        } finally {
            setLoadingSlots(false);
        }
    };

    // хелпер: есть ли у бокса хотя бы 1 будущий свободный слот
    const boxHasFutureFree = (items: BoxSlotsResponse['items']) => {
        const now = Date.now();
        return items.some(s =>
            s.status === 'free' && new Date(s.starts_at).getTime() > now // считаем только СЛЕДУЮЩИЕ, а не начавшиеся
        );
    };

// основная загрузка
    const loadAvailabilityForAll = useCallback(async (list: CarWash[], date: string) => {
        const entries: [string, { availableBoxes: number; totalFutureFreeSlots: number }][] = [];

        await Promise.all(
            list.map(async (cw) => {
                try {
                    const boxes = await fetchBoxes(Number(cw.id));
                    const boxIds = boxes.map(b => b.id); // ids из items (аналогично box_ids)

                    const perBoxFreeCounts = await Promise.all(
                        boxIds.map(async (boxId) => {
                            const slots = await fetchBoxSlots(Number(cw.id), boxId, date);
                            const now = Date.now();
                            const futureFree = (slots.items || []).filter(
                                r => r.status === 'free' && new Date(r.starts_at).getTime() > now
                            );
                            return {
                                boxId,
                                hasFutureFree: boxHasFutureFree(slots.items || []),
                                freeCount: futureFree.length,
                            };
                        })
                    );

                    const availableBoxes = perBoxFreeCounts.filter(x => x.hasFutureFree).length;
                    const totalFutureFreeSlots = perBoxFreeCounts.reduce((acc, x) => acc + x.freeCount, 0);

                    entries.push([cw.id, {availableBoxes, totalFutureFreeSlots}]);
                } catch {
                    entries.push([cw.id, {availableBoxes: 0, totalFutureFreeSlots: 0}]);
                }
            })
        );

        setAvailableByWash(Object.fromEntries(entries));
    }, []);

// триггерим при загрузке списка моек и смене даты
    useEffect(() => {
        if (carWashes.length > 0 && bookingDate) {
            loadAvailabilityForAll(carWashes, bookingDate);
        }
    }, [carWashes, bookingDate, loadAvailabilityForAll]);


    useEffect(() => {
        (async () => {
            if (!selectedWash || !selectedBoxId) return;
            try {
                setLoadingSlots(true);
                const slots = await fetchBoxSlots(Number(selectedWash.id), selectedBoxId, bookingDate);
                setBoxSlots(slots);
            } finally {
                setLoadingSlots(false);
            }
        })();
    }, [selectedWash?.id, selectedBoxId, bookingDate]);


    const openMapFocused = (wash: EnhancedCarWash) => {
        router.push({
            pathname: '/map',
            params: {focusId: wash.id, lat: String(wash.latitude), lng: String(wash.longitude)},
        });
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!userLocation || carWashes.length === 0) return;

            const origin = {lat: userLocation.latitude, lon: userLocation.longitude};
            const destinations = carWashes.map((cw) => ({
                lat: cw.latitude,
                lon: cw.longitude,
                id: cw.id,
            }));

            const map = await fetch2gisMatrix(origin, destinations);
            if (!cancelled) setTravelMap(map);
        })();

        return () => {
            cancelled = true;
        };
    }, [userLocation?.latitude, userLocation?.longitude, carWashes]);


    // геолокация
    useEffect(() => {
        let sub: Location.LocationSubscription | null = null;
        let cancelled = false;
        (async () => {
            try {
                const {status} = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setUserLocation({latitude: 43.2220, longitude: 76.8512});
                    return;
                }
                sub = await Location.watchPositionAsync(
                    {accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 5},
                    (loc) => {
                        if (!cancelled && loc?.coords) {
                            setUserLocation({latitude: loc.coords.latitude, longitude: loc.coords.longitude});
                        }
                    }
                );
            } catch {
                if (!cancelled) setUserLocation({latitude: 43.2220, longitude: 76.8512});
            }
        })();
        return () => {
            cancelled = true;
            sub?.remove();
        };
    }, []);

    const userStats = getUserStats(user?.id || 'default');

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    function isCarWashOpen(workingHours: { start: string; end: string; is24Hours: boolean }): boolean {
        if (workingHours.is24Hours) return true;

        const now = new Date();
        const [openHour, openMin] = workingHours.start.split(':').map(Number);
        const [closeHour, closeMin] = workingHours.end.split(':').map(Number);

        const open = new Date();
        open.setHours(openHour, openMin, 0, 0);
        const close = new Date();
        close.setHours(closeHour, closeMin, 0, 0);

        return now >= open && now < close;
    }


    const enhancedCarWashes = useMemo(() => {
        const me = userLocation ?? {latitude: 43.2220, longitude: 76.8512};

        return carWashes.map((carWash) => {
            const travel = travelMap[carWash.id];
            const distanceKm2gis = travel ? (travel.distanceMeters / 1000) : null;
            const timeMin2gis = travel ? Math.round(travel.travelTimeSec / 60) : null;
            const haversineKm = calculateDistance(me.latitude, me.longitude, carWash.latitude, carWash.longitude);

            const availEntry = availableByWash[carWash.id];
            const availBoxes = availEntry?.availableBoxes ?? 0;
            const slotsTotal = availEntry?.totalFutureFreeSlots ?? 0;

            return {
                ...carWash,
                distance: distanceKm2gis ?? haversineKm,
                travelTimeMin: timeMin2gis ?? Math.round(haversineKm / 40 * 60),
                bookingSlots: [],
                availableSlots: availBoxes,
                futureFreeSlots: slotsTotal,
                city: (carWash as any)?.city || '', // 👈 подстраховка, даже если нет на бэке
                extraServices: (carWash as any)?.extraServices || [], // 👈 под фильтр по допам
            };
        });
    }, [carWashes, userLocation, travelMap, availableByWash]);


    const nearestId = useMemo(() => {
        if (enhancedCarWashes.length === 0) return null;
        const sorted = [...enhancedCarWashes].sort(
            (a, b) => (a.travelTimeMin ?? a.distance) - (b.travelTimeMin ?? b.distance)
        );
        return sorted[0]?.id ?? null;
    }, [enhancedCarWashes]);


    const filteredCarWashes = useMemo(() => {
        let filtered = enhancedCarWashes;

        // === Применяем активные фильтры ===

        // 1. Кузов
        if (activeFilters.body) {
            filtered = filtered.filter(cw =>
                cw.availableServices?.some(
                    s => s?.bodyName?.toLowerCase?.() === activeFilters.body?.toLowerCase?.()
                )
            );
        }

        // 2. Цена
        const [min, max] = activeFilters.priceRange || [0, Infinity];
        filtered = filtered.filter(cw =>
            typeof cw.price === 'number' ? cw.price >= min && cw.price <= max : true
        );

        // 3. "Работает сейчас"
        if (activeFilters.isOpenNow) {
            filtered = filtered.filter(cw =>
                cw.workingHoursDetailed
                    ? isCarWashOpen(cw.workingHoursDetailed)
                    : false
            );
        }

        // 4. TODO: фильтр по городу (когда появится поле city)
        if (activeFilters.city) {
            filtered = filtered.filter(cw =>
                cw.city?.toLowerCase?.() === activeFilters.city?.toLowerCase?.()
            );
        }

        // 5. Доп. услуги (пока только по совпадению по имени)
        if (activeFilters.extras?.length) {
            filtered = filtered.filter(cw => {
                const names = cw.extraServices?.map((e: { name: string; }) => e.name.toLowerCase()) || [];
                return activeFilters.extras!.some(e =>
                    names.includes(e.toLowerCase())
                );
            });
        }

        // 6. Поиск
        filtered = filtered.filter(
            cw =>
                (cw.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (cw.address ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 7. Сортировка
        switch (activeFilters.sortBy) {
            case 'distance':
                filtered = [...filtered].sort((a, b) => a.distance - b.distance);
                break;
            case 'rating':
                filtered = [...filtered].sort((a, b) => b.rating - a.rating);
                break;
            case 'price':
                filtered = [...filtered].sort((a, b) => a.price - b.price);
                break;
            default:
                break;
        }

        // === Если фильтры не выбраны, показываем первым ближайший с доступными слотами ===
        const noFilters =
            !activeFilters.body &&
            (!activeFilters.extras || activeFilters.extras.length === 0) &&
            (!activeFilters.city) &&
            !activeFilters.isOpenNow &&
            (!activeFilters.sortBy);

        if (noFilters) {
            // находим ближайшую автомойку с доступными слотами
            const nearestWithSlots = [...enhancedCarWashes]
                .filter(cw => cw.futureFreeSlots > 0)
                .sort((a, b) => a.distance - b.distance)[0];

            if (nearestWithSlots) {
                filtered = [
                    nearestWithSlots,
                    ...filtered.filter(cw => cw.id !== nearestWithSlots.id),
                ];
            }
        }


        return filtered.slice(0, 10);
    }, [enhancedCarWashes, searchQuery, activeFilters]);


    // слоты
    function generateBookingSlots(carWash: CarWash): BookingSlot[] {
        const slots: BookingSlot[] = [];
        const workingHours = carWash.workingHoursDetailed;

        if (workingHours.is24Hours) {
            for (let hour = 0; hour < 24; hour++) {
                slots.push({
                    id: `${hour}:00`,
                    time: `${hour.toString().padStart(2, '0')}:00`,
                    available: Math.random() > 0.3,
                    price: Math.floor(Math.random() * 1000) + 2000,
                });
            }
        } else {
            const startHour = parseInt(workingHours.start.split(':')[0]);
            const endHour = parseInt(workingHours.end.split(':')[0]);

            if (startHour <= endHour) {
                for (let hour = startHour; hour < endHour; hour++) {
                    slots.push({
                        id: `${hour}:00`,
                        time: `${hour.toString().padStart(2, '0')}:00`,
                        available: Math.random() > 0.3,
                        price: Math.floor(Math.random() * 1000) + 2000,
                    });
                }
            } else {
                for (let hour = startHour; hour < 24; hour++) {
                    slots.push({
                        id: `${hour}:00`,
                        time: `${hour.toString().padStart(2, '0')}:00`,
                        available: Math.random() > 0.3,
                        price: Math.floor(Math.random() * 1000) + 2000,
                    });
                }
                for (let hour = 0; hour < endHour; hour++) {
                    slots.push({
                        id: `${hour}:00`,
                        time: `${hour.toString().padStart(2, '0')}:00`,
                        available: Math.random() > 0.3,
                        price: Math.floor(Math.random() * 1000) + 2000,
                    });
                }
            }
        }
        return slots;
    }

    // мок-уведомления
    useEffect(() => {
        const mockNotifications: Notification[] = [
            {
                id: '1',
                title: '🔥 ПОРА МЫТЬСЯ!',
                message: 'Прошло 7 дней с последней мойки. Сегодня дождь - идеальное время!',
                type: 'reminder',
                timestamp: new Date(),
                read: false
            },
            {
                id: '2',
                title: '⏰ Напоминание о записи',
                message: 'Через 20 минут ваша запись в WASH PREMIUM. Не опаздывайте!',
                type: 'booking',
                timestamp: new Date(Date.now() - 10 * 60 * 1000),
                read: false
            },
            {
                id: '3',
                title: '🎯 ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ',
                message: 'Только сегодня! Скидка 50% на детейлинг в AUTO SPA DELUXE',
                type: 'promo',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                read: true
            },
        ];
        setNotifications(mockNotifications);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkerPress = (cw: CarWash) => {
        const enhanced = enhancedCarWashes.find(e => e.id === cw.id);
        if (enhanced) setSelectedWash(enhanced);
    };

    const handleLogout = () => {
        logout();
    };

    const handleTakePhoto = async () => {
        try {
            const {status} = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Ошибка', 'Необходимо разрешение на использование камеры');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, aspect: [1, 1], quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{resize: {width: 300, height: 300}}],
                    {compress: 0.8, format: ImageManipulator.SaveFormat.JPEG}
                );
                setProfilePhoto(manipulatedImage.uri);
                try {
                    await uploadPhotoMutation.mutateAsync({
                        userId: user?.id || 'default',
                        photoUri: manipulatedImage.uri,
                        type: 'car-owner',
                    });
                } catch (e) {
                    console.log('uploadPhoto error', e);
                }
            }
        } catch (error) {
            console.log('Error taking photo:', error);
            Alert.alert('Ошибка', 'Не удалось сделать фото');
        }
    };

    const handlePickImage = async () => {
        try {
            const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, aspect: [1, 1], quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{resize: {width: 300, height: 300}}],
                    {compress: 0.8, format: ImageManipulator.SaveFormat.JPEG}
                );
                setProfilePhoto(manipulatedImage.uri);
                try {
                    await uploadPhotoMutation.mutateAsync({
                        userId: user?.id || 'default',
                        photoUri: manipulatedImage.uri,
                        type: 'car-owner',
                    });
                } catch (e) {
                    console.log('uploadPhoto error', e);
                }
            }
        } catch (error) {
            console.log('Error picking image:', error);
            Alert.alert('Ошибка', 'Не удалось выбрать изображение');
        }
    };

    const handlePhotoOptions = () => {
        Alert.alert('Выберите фото', 'Откуда вы хотите добавить фото?', [
            {text: 'Камера', onPress: handleTakePhoto},
            {text: 'Галерея', onPress: handlePickImage},
            {text: 'Отмена', style: 'cancel'},
        ]);
    };

    const handleEditProfile = () => {
        setNextSheet('editProfile');
        setShowProfile(false);
    };

    const handleSaveProfile = async () => {
        try {
            await updateOwnerMutation.mutateAsync({
                userId: user?.id || 'default',
                name: editedName || undefined,
                phone: user?.phone || undefined,
                carDetails: user?.carDetails
                    ? {
                        ownerName: editedName || user.carDetails.ownerName,
                        licensePlate: user.carDetails.licensePlate,
                        brand: user.carDetails.brand,
                        model: user.carDetails.model,
                        bodyType: user.carDetails.bodyType,
                    }
                    : undefined,
            });
            Alert.alert('Сохранено', 'Профиль успешно обновлен');
            setEditingProfile(false);
        } catch (error) {
            console.log('updateOwner error', error);
            Alert.alert('Ошибка', 'Не удалось сохранить профиль');
        }
    };

    const handleNotificationPress = () => setShowNotifications(true);
    const markNotificationAsRead = (id: string) => setNotifications(prev => prev.map(n => (n.id === id ? {
        ...n,
        read: true
    } : n)));
    const markAllNotificationsAsRead = () => setNotifications(prev => prev.map(n => ({...n, read: true})));

    const handleNotificationsSettings = () => {
        setShowProfile(false);
        setShowNotificationsSettings(true);
    };
    const handleSecuritySettings = () => {
        setShowProfile(false);
        setShowSecuritySettings(true);
    };
    const handleHelp = () => {
        setShowProfile(false);
        setShowHelpModal(true);
    };

    const handleQRScan = async (data: string) => {
        const m = data.match(/^washly:\/\/qr\/(.+)$/i) || data.match(/^([A-Za-z0-9._~\-]+=*)$/);
        if (!m || !m[1]) {
            Alert.alert('Ошибка', 'Неверный QR-код');
            setShowQRScanner(false);
            return;
        }

        const token = m[1];
        setQrToken(token);
        setQrStatus('initiated');
        setShowQRScanner(false);

        // 👇 1) берём СВЕЖИЕ брони
        let fresh: MyBooking[] = myBookings;
        try {
            fresh = await reload(); // вернёт самый актуальный массив
        } catch {
            // игнор
        }

        // 👇 2) первая активная
        const booking = pickActive(fresh);
        if (!booking) {
            Alert.alert('Бронь не найдена', 'У вас нет активной брони для подтверждения.');
            setQrToken(null);
            setQrStatus(null);
            return;
        }

        try {
            await scanBooking(token, Number(booking.id));
            setQrStatus('scanned');

            // разовый poll для суммы/допов
            let s: PollResponse | null = null;
            try {
                s = await pollSession(token);
                setPollInfo(s);
                if (s?.status) setQrStatus(s.status);
                if (s?.amount_total) setQrAmount(s.amount_total);
            } catch {
            }

            const cwId = Number(booking.carWashId ?? s?.carWashId ?? 0) || 0;

            if (cwId) {
                try {
                    const d = await fetchCarWashDetail(cwId);
                    setQrWashDetail(d);
                    const extras = (d?.extraServices || []).map((e: any) => ({id: e.id, name: e.name, price: e.price}));
                    setQrWashExtras(extras);

                    await prefillExtrasFromBookingAndPoll({
                        token,
                        pollSelectedIds: s?.selected_extra_ids,
                        booking,
                        extrasCatalog: extras,
                    });
                } catch {
                    setQrWashExtras([]);
                }
            } else {
                setQrWashExtras([]);
                setSelectedQrExtras(s?.selected_extra_ids || []);
            }

            setExtrasVisible(true);
            startPoll(token);
        } catch (e: any) {
            Alert.alert('Ошибка', e?.message ?? 'Не удалось подтвердить визит');
            setQrToken(null);
            setQrStatus(null);
        }
    };


    // длина одного слота в минутах для списка (в модалке реальная длительность приходит из washDetail)
    const LIST_SLOT_MINUTES = 40;

    function parseHHMM(hhmm: string) {
        const [h, m] = hhmm.split(':').map(Number);
        return {h: h || 0, m: m || 0};
    }

// проверка, открыт ли сейчас, + сколько минут осталось до закрытия
    function getMinutesUntilCloseNow(working: { start: string; end: string; is24Hours: boolean }) {
        if (working.is24Hours) {
            // до конца суток
            const now = new Date();
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);
            return {openNow: true, minutesLeft: Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 60000))};
        }

        const now = new Date();

        const {h: sh, m: sm} = parseHHMM(working.start);
        const {h: eh, m: em} = parseHHMM(working.end);

        const open = new Date(now);
        open.setHours(sh, sm, 0, 0);

        const close = new Date(now);
        close.setHours(eh, em, 0, 0);

        // обычный день (start <= end)
        if (open <= close) {
            const openNow = now >= open && now < close;
            const minutesLeft = openNow ? Math.max(0, Math.floor((close.getTime() - now.getTime()) / 60000)) : 0;
            return {openNow, minutesLeft};
        }

        // "через полночь" (пример: 20:00–06:00)
        const closeNextDay = new Date(open);
        closeNextDay.setDate(closeNextDay.getDate() + 1);
        closeNextDay.setHours(eh, em, 0, 0);

        // открыто, если сейчас после "open" ИЛИ до "end" следующего дня
        const openNow = now >= open || now < close;
        const minutesLeft = openNow
            ? (now >= open
                ? Math.max(0, Math.floor((closeNextDay.getTime() - now.getTime()) / 60000))
                : Math.max(0, Math.floor((close.getTime() - now.getTime()) / 60000)))
            : 0;

        return {openNow, minutesLeft};
    }

// итоговая функция для списка: доступные слоты "сейчас" до закрытия
    function computeAvailableSlotsNow(carWash: CarWash, slotMinutes = LIST_SLOT_MINUTES) {
        if (!carWash?.workingHoursDetailed) return 0;
        const {openNow, minutesLeft} = getMinutesUntilCloseNow(carWash.workingHoursDetailed);
        if (!openNow) return 0;
        if (slotMinutes <= 0) return 0;
        return Math.floor(minutesLeft / slotMinutes);
    }


    // @ts-ignore
    return (

        <View style={[styles.container, {paddingTop: insets.top}]}>

            <OwnerHeader />

            <QRScanner isVisible={showQRScanner} onScan={handleQRScan} onClose={() => setShowQRScanner(false)}/>

            <BookingModal
                visible={showBooking}
                insetsTop={insets.top}
                selectedWash={selectedWash as any}
                washDetail={washDetail}
                boxes={boxes}
                selectedBoxId={selectedBoxId}
                setSelectedBoxId={(id) => setSelectedBoxId(id)}
                loadingSlots={loadingSlots}
                boxSlots={boxSlots}
                bookingDate={bookingDate}
                onReloadSlots={async (washId, boxId, date) => {
                    try {
                        setLoadingSlots(true);
                        const slots = await fetchBoxSlots(washId, boxId, date);
                        setBoxSlots(slots);
                    } finally {
                        setLoadingSlots(false);
                    }
                }}

                selectedSlot={selectedSlot}
                setSelectedSlot={setSelectedSlot}
                selectedBodyId={selectedBodyId}
                setSelectedBodyId={(id) => setSelectedBodyId(id)}
                selectedExtras={selectedExtras}
                toggleExtra={toggleExtra}

                getBasePrice={getBasePrice}
                getExtrasTotal={getExtrasTotal}
                calculateTotalPrice={calculateTotalPrice}
                onClose={() => {
                    setShowBooking(false);
                    setSelectedSlot(null);
                    setSelectedWash(null);
                    setSelectedExtras([]);
                    setSelectedBodyId(null);
                }}
            />


            {/* Профиль */}
            <Modal
                visible={showProfile}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowProfile(false)}
                onDismiss={() => {
                    if (nextSheet === 'editProfile') {
                        setNextSheet(null);
                        setShowEditProfile(true);
                    }
                }}
            >
                <View style={[styles.profileModal, {paddingTop: insets.top}]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>ПРОФИЛЬ</Text>
                        <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.profileCloseButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
                        <View>
                            <View style={styles.profileUserCard}>
                                <User color="#FF6B35" size={32}/>
                                <View style={styles.profileUserInfo}>
                                    <View style={styles.profileUserInfo}>
                                        <Text style={styles.profileUserName}>
                                            <Text style={styles.profileUserName}>
                                                {user?.username || user?.name || user?.carDetails?.ownerName || 'Пользователь'}
                                            </Text>
                                        </Text>
                                        <Text style={styles.profileUserPhone}>{user?.phone}</Text>
                                        <View style={styles.profileStatusBadge}>
                                            <Crown color="#FFD700" size={12}/>
                                            <Text style={styles.profileStatusText}>VIP КЛИЕНТ</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsSectionTitle}>НАСТРОЙКИ</Text>

                            <TouchableOpacity style={styles.settingsItem} onPress={handleEditProfile}>
                                <Edit color="#FF6B35" size={20}/>
                                <Text style={styles.settingsItemText}>Редактировать профиль</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.settingsItem}
                                onPress={() => {
                                    setShowProfile(false);
                                    router.push('/subscription');
                                }}
                            >
                                <Crown color="#FF6B35" size={20}/>
                                <Text style={styles.settingsItemText}>Подписка</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.settingsItem} onPress={handleNotificationsSettings}>
                                <Bell color="#FF6B35" size={20}/>
                                <Text style={styles.settingsItemText}>Уведомления</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.settingsItem} onPress={handleHelp}>
                                <HelpCircle color="#FF6B35" size={20}/>
                                <Text style={styles.settingsItemText}>Помощь</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.logoutSection}>
                            <TouchableOpacity
                                style={styles.profileLogoutButton}
                                onPress={() => {
                                    setShowProfile(false);
                                    handleLogout();
                                }}
                            >
                                <LogOut color="#FF0000" size={20}/>
                                <Text style={styles.profileLogoutText}>Выйти из аккаунта</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.profileLogoutButton, {borderColor: '#FF3B30'}]}
                                onPress={handleDeleteAccount}
                            >
                                <Trash2 color="#FF3B30" size={20}/>
                                <Text style={[styles.profileLogoutText, {color: '#FF3B30'}]}>
                                    Удалить аккаунт
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>


            {/* Notifications */}
            <Modal
                visible={showNotifications}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={[styles.profileModal, {paddingTop: insets.top}]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>УВЕДОМЛЕНИЯ</Text>
                        <View style={styles.notificationHeaderActions}>
                            <TouchableOpacity onPress={markAllNotificationsAsRead} style={styles.markAllReadButton}>
                                <Text style={styles.markAllReadText}>Прочитать все</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}
                                              style={styles.profileCloseButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.profileContent}>
                        {notifications.length === 0 ? (
                            <View style={styles.emptyNotifications}>
                                <Bell color="#888888" size={48}/>
                                <Text style={styles.emptyNotificationsText}>Нет уведомлений</Text>
                                <Text style={styles.emptyNotificationsSubtext}>
                                    Здесь будут отображаться важные уведомления
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.notificationsList}>
                                {notifications.map((notification) => (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={[styles.notificationItem, !notification.read && styles.notificationItemUnread]}
                                        onPress={() => markNotificationAsRead(notification.id)}
                                    >
                                        <View style={styles.notificationIcon}>
                                            {notification.type === 'reminder' && <Target color="#FF6B35" size={20}/>}
                                            {notification.type === 'booking' && <Calendar color="#FF6B35" size={20}/>}
                                            {notification.type === 'promo' && <Trophy color="#FF6B35" size={20}/>}
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text
                                                style={[
                                                    styles.notificationTitle,
                                                    !notification.read && styles.notificationTitleUnread,
                                                ]}
                                            >
                                                {notification.title}
                                            </Text>
                                            <Text style={styles.notificationMessage}>{notification.message}</Text>
                                            <Text style={styles.notificationTime}>
                                                {notification.timestamp.toLocaleTimeString('ru-RU', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Text>
                                        </View>
                                        {!notification.read && <View style={styles.notificationUnreadDot}/>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* Notifications Settings */}
            <Modal
                visible={showNotificationsSettings}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNotificationsSettings(false)}
            >
                <View style={[styles.profileModal, {paddingTop: insets.top}]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>УВЕДОМЛЕНИЯ</Text>
                        <TouchableOpacity onPress={() => setShowNotificationsSettings(false)}
                                          style={styles.profileCloseButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.profileContent}>
                        <View style={styles.settingsSection}>
                            <TouchableOpacity style={styles.settingsToggleItem}>
                                <View style={styles.settingsToggleInfo}>
                                    <Bell color="#FF6B35" size={20}/>
                                    <View style={styles.settingsToggleText}>
                                        <Text style={styles.settingsItemText}>Push-уведомления</Text>
                                        <Text style={styles.settingsItemSubtext}>Получать уведомления о записях</Text>
                                    </View>
                                </View>
                                <View style={styles.toggleSwitch}>
                                    <View style={styles.toggleActive}/>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.settingsToggleItem}>
                                <View style={styles.settingsToggleInfo}>
                                    <Target color="#FF6B35" size={20}/>
                                    <View style={styles.settingsToggleText}>
                                        <Text style={styles.settingsItemText}>Напоминания о мойке</Text>
                                        <Text style={styles.settingsItemSubtext}>Умные напоминания каждые 7 дней</Text>
                                    </View>
                                </View>
                                <View style={styles.toggleSwitch}>
                                    <View style={styles.toggleActive}/>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.settingsToggleItem}>
                                <View style={styles.settingsToggleInfo}>
                                    <Trophy color="#FF6B35" size={20}/>
                                    <View style={styles.settingsToggleText}>
                                        <Text style={styles.settingsItemText}>Акции и скидки</Text>
                                        <Text style={styles.settingsItemSubtext}>Специальные предложения</Text>
                                    </View>
                                </View>
                                <View style={styles.toggleSwitch}>
                                    <View style={styles.toggleInactive}/>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>


            {/* Help */}
            <Modal
                visible={showHelpModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowHelpModal(false)}
            >
                <View style={[styles.profileModal, {paddingTop: insets.top}]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>ПОМОЩЬ</Text>
                        <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.profileCloseButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.profileContent}>
                        <View style={styles.helpSection}>
                            <Text style={styles.helpSectionTitle}>ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ</Text>

                            <View style={styles.helpItem}>
                                <Text style={styles.helpQuestion}>Как работает подписка?</Text>
                                <Text style={styles.helpAnswer}>
                                    Подписка дает вам неограниченный доступ к мойкам во всех партнерских автомойках.
                                    Просто отсканируйте QR-код и начинайте мойку.
                                </Text>
                            </View>

                            <View style={styles.helpItem}>
                                <Text style={styles.helpQuestion}>Как отсканировать QR-код?</Text>
                                <Text style={styles.helpAnswer}>
                                    Нажмите кнопку &quot;Сканировать QR&quot; на главном экране, наведите камеру на
                                    QR-код в боксе автомойки.
                                </Text>
                            </View>

                            <View style={styles.helpItem}>
                                <Text style={styles.helpQuestion}>Что делать если QR-код не работает?</Text>
                                <Text style={styles.helpAnswer}>
                                    Убедитесь что у вас активная подписка и хорошее освещение. Если проблема не
                                    решается, обратитесь к администратору автомойки.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.contactSection}>
                            <Text style={styles.contactSectionTitle}>СВЯЗАТЬСЯ С НАМИ</Text>

                            <TouchableOpacity style={styles.contactItem}
                                              onPress={() => Alert.alert('Телефон', '+7 (777) 123-45-67')}>
                                <Phone color="#FF6B35" size={20}/>
                                <Text style={styles.contactText}>Горячая линия</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.contactItem}
                                              onPress={() => Alert.alert('Email', 'support@carwash.kz')}>
                                <Settings color="#FF6B35" size={20}/>
                                <Text style={styles.contactText}>Техническая поддержка</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
            <Modal
                visible={extrasVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setExtrasVisible(false)}
            >
                <View style={[styles.profileModal]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>ПОДТВЕРЖДЕНИЕ ВИЗИТА</Text>
                        <TouchableOpacity onPress={() => setExtrasVisible(false)} style={styles.profileCloseButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
                        {/* CARD 1: Мойка + выбранные допы */}
                        <View style={styles.checkoutCard}>
                            <Text style={styles.checkoutBlockTitle}>Ваша услуга</Text>

                            <View style={styles.washRow}>
                                <Image
                                    source={{uri: (qrWashDetail as any)?.image || (selectedWash as any)?.image}}
                                    style={styles.washThumb}
                                />
                                <View style={{flex: 1}}>
                                    <Text style={styles.washName}>
                                        {qrWashDetail?.name || selectedWash?.name || 'Автомойка'}
                                    </Text>
                                    <Text style={styles.washAddress} numberOfLines={2}>
                                        {qrWashDetail?.address || selectedWash?.address || ''}
                                    </Text>
                                    {/* можете вывести текущее окно/время, если нужно */}
                                </View>
                            </View>

                            {/* Выбранные допы (интерактивные чипы) */}
                            {qrWashExtras.length > 0 ? (
                                <>
                                    <Text style={styles.extrasTitle}>Дополнительные услуги</Text>
                                    <View style={styles.extrasGrid}>
                                        {qrWashExtras.map(ex => {
                                            const active = selectedQrExtras.includes(ex.id);
                                            return (
                                                <TouchableOpacity
                                                    key={ex.id}
                                                    style={[styles.extraBtn, active && styles.extraBtnActive, isUpdatingExtras && {opacity: 0.7}]}
                                                    onPress={() => toggleQrExtra(ex.id)}
                                                    disabled={isUpdatingExtras}
                                                >
                                                    <Text
                                                        style={[styles.extraBtnText, active && styles.extraBtnTextActive]}>
                                                        {ex.name}
                                                    </Text>
                                                    <Text>· {ex.price.toLocaleString()} ₸</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.mutedText}>Доп. услуги недоступны</Text>
                            )}
                        </View>
                        {/* CARD 2: Биллинг */}
                        <View style={styles.billingCard}>
                            <Text style={styles.checkoutBlockTitle}>Счёт</Text>

                            <View style={styles.billingRow}>
                                <Text style={styles.billingLabel}>Цена мойки</Text>
                                <Text style={styles.billingValue}>
                                    {getBasePriceQR().toLocaleString()} ₸
                                </Text>
                            </View>
                            <View style={styles.billingRow}>
                                <Text style={styles.billingLabel}>Доп. услуги</Text>
                                <Text style={styles.billingValue}>
                                    {getExtrasTotalQR().toLocaleString()} ₸
                                </Text>
                            </View>
                            <View style={styles.billingRow}>
                                <Text style={styles.billingLabel}>Сервисный сбор</Text>
                                <Text style={styles.billingValue}>
                                    {getServiceFee(getBasePriceQR() + getExtrasTotalQR()).toLocaleString()} ₸
                                </Text>
                            </View>

                            <View style={styles.billingDivider}/>

                            <View style={styles.billingTotalRow}>
                                <Text style={styles.billingTotalLabel}>Итого</Text>
                                <Text style={styles.billingTotalValue}>
                                    {getGrandTotalQR().toLocaleString()} ₸
                                </Text>
                            </View>
                        </View>
                        <View style={styles.paymentCard}>
                            <Text style={styles.checkoutBlockTitle}>Оплата</Text>
                            <View style={styles.paySelector}>
                                <TouchableOpacity
                                    style={[styles.payOption, paymentMethod === 'cash' && styles.payOptionActive]}
                                    onPress={() => setPaymentMethod('cash')}
                                >
                                    <Text
                                        style={[styles.payOptionText, paymentMethod === 'cash' && styles.payOptionTextActive]}>
                                        Наличные
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.payOption, paymentMethod === 'card' && styles.payOptionActive]}
                                    onPress={() => {
                                        setPaymentMethod('card');
                                        Alert.alert('Скоро', 'Оплата картой пока недоступна.');
                                    }}
                                >
                                    <Text style={styles.payOptionText}>Карта (скоро)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* CTA */}
                        <View style={{padding: 16}}>
                            <TouchableOpacity
                                disabled={isPaying}
                                style={[styles.primaryCTA, isPaying && {opacity: 0.6}]}
                                onPress={() => {
                                    if (paymentMethod === 'card') {
                                        Alert.alert('Скоро', 'Оплата картой пока недоступна.');
                                        return;
                                    }
                                    handlePay('cash');
                                }}
                            >
                                <Text style={styles.primaryCTAText}>
                                    {isPaying ? 'Обрабатываем…' : 'Подтвердить и начать'}
                                </Text>
                            </TouchableOpacity>
                            {pollInfo?.status === 'cash_waiting_approval' && (
                                <Text style={styles.pendingCashText}>Ожидаем подтверждение кассира…</Text>
                            )}
                        </View>

                    </ScrollView>
                </View>
            </Modal>

            <EditProfileModal
                visible={showEditProfile}
                onClose={() => setShowEditProfile(false)}
            />

            <FiltersModal
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={handleApplyFilters}
            />

            {/* === НИЖНИЙ НАВБАР === */}
            <View style={[styles.bottomNav, {paddingBottom: Math.max(insets.bottom, 12)}]}>
                <View style={styles.bottomNavRow}>
                    <TouchableOpacity style={styles.bottomNavButton} onPress={() => router.push('/map')}>
                        <MapIcon color={colors.primary} size={20}/>
                        <Text style={styles.bottomNavText}>Карта</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomNavCTA} onPress={() => setShowQRScanner(true)}>
                        <QrCode color={colors.textDark} size={20}/>
                        <Text style={styles.bottomNavCTAText}>QR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}



