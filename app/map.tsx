// map.tsx
import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    KeyboardEventName, Alert,
    Keyboard, Platform, Dimensions
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useLocalSearchParams} from 'expo-router';
import CarWashMap, {CarWashMapHandle} from '@/components/CarWashMap/CarWashMap';
import {
    fetchCarWashes, type CarWash,
    fetchCarWashDetail,
    fetchBoxes,
    fetchBoxSlots,
    type CarWashDetail,
    type Box,
    type BoxSlotsResponse,
} from '@/src/services/api/carWashesApi';
import {styles} from '@/assets/styles/map.styles';
import {Modalize} from 'react-native-modalize';
import BookingModal from '@/components/Modals/BookingModal/BookingModal';

import {ScrollView as GHScrollView} from 'react-native-gesture-handler';
import 'react-native-reanimated';
import BottomSheet, {BottomSheetFlatList} from '@gorhom/bottom-sheet';


import {SlidersHorizontal, MapPin} from 'lucide-react-native';
import FiltersModal from '@/components/Modals/Filter/FiltersModal';
import BottomNav from '@/components/BottomNav/BottomNav'
import QRScanner from '@/components/Modals/QRScanner/QRScanner';
import {scanBooking, pollSession, updateExtras, pay, type PollResponse} from '@/src/services/api/qrApi';
import {useMyBookings} from '@/src/data/bookings/useMyBookings';
import type {MyBooking} from '@/src/types/bookings';
import type {BookingSlot} from '@/src/data/carWashes';

import OwnerHeader from "@/components/OwnerHeader/OwnerHeader";
import {GIS_API_KEY} from '@/src/config/env'
import SelectList from '@/components/SelectList/SelectList';
import {useReferenceData} from '@/src/stores/useReferenceData';

import {getCenterByName} from '@/src/constants/cityCenters';
import QrExtrasModal from "@/components/Modals/QrExtrasModal/QrExtrasModal";

export default function MapScreen() {
    const insets = useSafeAreaInsets();
    const {lat, lng} = useLocalSearchParams<{ focusId?: string; lat?: string; lng?: string }>();

    const [washes, setWashes] = useState<CarWash[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortNearest, setSortNearest] = useState(false);
    const [sortTopRated, setSortTopRated] = useState(false);
    const [showOpenOnly, setShowOpenOnly] = useState(false);

    // refs
    const catalogSheetRef = useRef<Modalize>(null);
    const bookingSheetRef = useRef<Modalize>(null);

    const [focusId, setFocusId] = useState<string | null>(null);
    const [showBooking, setShowBooking] = useState(false);
    const [selectedWash, setSelectedWash] = useState<CarWash | null>(null);
    const timeoutRef = useRef<number | null>(null);

    // данные модалки
    const [washDetail, setWashDetail] = useState<CarWashDetail | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
    const [boxSlots, setBoxSlots] = useState<BoxSlotsResponse | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<number[]>([]);
    const [bookingDate, setBookingDate] = useState<string>(() =>
        new Date().toISOString().slice(0, 10),
    );

    const [category, setCategory] = useState<'all' | 'car_wash' | 'sto' | 'tire' | 'oil'>('all');

    // === QR session state ===
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [qrStatus, setQrStatus] = useState<string | null>(null)
    const [pollInfo, setPollInfo] = useState<PollResponse | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const qrActiveRef = useRef(false);

    // чек-аут
    const [qrWashDetail, setQrWashDetail] = useState<CarWashDetail | null>(null);
    const [qrWashExtras, setQrWashExtras] = useState<{ id: number; name: string; price: number }[]>([]);
    const [selectedQrExtras, setSelectedQrExtras] = useState<number[]>([]);
    const [qrAmount, setQrAmount] = useState<string | null>(null);
    const [extrasVisible, setExtrasVisible] = useState(false);
    const extrasOpenedFor = useRef<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [isUpdatingExtras, setIsUpdatingExtras] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const extrasSavingRef = useRef(false);

    const {myBookings, reload} = useMyBookings();
    const pickActive = (list: MyBooking[]) => list.find(b => b.status === 'booked') || null;

    const norm = (s?: string) =>
        String(s || '').toLowerCase().replace(/[.,;:!?()/\\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const uniqNums = (arr: number[]) => Array.from(new Set(arr));

    function mapBookingExtrasToIds(booking: any, extrasCatalog: { id: number; name: string }[]) {
        if (!booking || !extrasCatalog?.length) return [] as number[];
        const idsFromBooking = Array.isArray(booking.extra_service_ids) ? (booking.extra_service_ids as number[]) : [];
        if (idsFromBooking.length) {
            const catalogIds = new Set(extrasCatalog.map(e => e.id));
            return idsFromBooking.filter(id => catalogIds.has(id));
        }
        const namesFromBooking: string[] =
            Array.isArray(booking.extra_services) ? booking.extra_services :
                typeof booking.extra_services === 'string' ? booking.extra_services.split(',') :
                    Array.isArray(booking.extras) ? booking.extras : [];
        if (!namesFromBooking.length) return [];
        const byName = new Map(extrasCatalog.map(e => [norm(e.name), e.id]));
        return uniqNums(namesFromBooking.map((n: string) => byName.get(norm(n))).filter((v): v is number => typeof v === 'number'));
    }

    const {cities, load: loadRef} = useReferenceData();
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const selectedCityName = useMemo(
        () => cities.find(c => String(c.id) === String(selectedCityId))?.name ?? null,
        [cities, selectedCityId]
    );

// один раз тянем справочники
    useEffect(() => {
        loadRef().catch(() => {
        });
    }, []);


    async function prefillExtrasFromBookingAndPoll({
                                                       token, pollSelectedIds, booking, extrasCatalog,
                                                   }: {
        token: string;
        pollSelectedIds: number[] | undefined;
        booking: any;
        extrasCatalog: { id: number; name: string }[];
    }) {
        const fromBooking = mapBookingExtrasToIds(booking, extrasCatalog);
        const fromPoll = Array.isArray(pollSelectedIds) ? pollSelectedIds : [];
        const union = uniqNums([...(fromPoll || []), ...(fromBooking || [])]);
        setSelectedQrExtras(union);

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

    const stopPoll = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        qrActiveRef.current = false;
    };

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
                setQrStatus(s?.status || 'initiated');
                if (s?.amount_total) setQrAmount(s.amount_total);
                if (Array.isArray(s?.selected_extra_ids) && !extrasSavingRef.current) {
                    setSelectedQrExtras(s.selected_extra_ids);
                }
            } catch {
            }
        };
        tick();
        pollRef.current = setInterval(tick, 1500);
    };
    useEffect(() => () => stopPoll(), []);

    const toggleQrExtra = async (id: number) => {
        if (!qrToken || isUpdatingExtras) return;
        const prev = selectedQrExtras;
        const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];

        setSelectedQrExtras(next);
        setIsUpdatingExtras(true);
        extrasSavingRef.current = true;
        try {
            const r = await updateExtras(qrToken, next);
            if (r?.amount_total) setQrAmount(r.amount_total);
        } catch (e: any) {
            setSelectedQrExtras(prev);
            Alert.alert('Ошибка', e?.message ?? 'Не удалось обновить доп. услуги');
        } finally {
            setIsUpdatingExtras(false);
            extrasSavingRef.current = false;
        }
    };

    const handlePay = async (method: 'card' | 'cash') => {
        if (!qrToken) return;
        try {
            setIsPaying(true);
            await pay(qrToken, method);
            if (method === 'cash') {
                setQrStatus('cash_waiting_approval');
                Alert.alert('Ожидание', 'Попросите администратора подтвердить оплату наличными.');
                startPoll(qrToken);
            } else {
                Alert.alert('Скоро', 'Оплата картой пока недоступна.');
            }
        } catch (e: any) {
            Alert.alert('Ошибка', e?.message ?? 'Оплата не прошла');
        } finally {
            setIsPaying(false);
        }
    };


    const handleQRScan = async (data: string) => {
        // парсим washly://qr/<token> или просто base64/алфанумерик токен
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

        // подтянуть свежие брони
        let fresh: MyBooking[] = myBookings;
        try {
            fresh = await reload();
        } catch {
        }
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

            // единичный poll для суммы/допов
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
                        token, pollSelectedIds: s?.selected_extra_ids, booking, extrasCatalog: extras,
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

    const {openQR} = useLocalSearchParams<{ openQR?: string }>();
    useEffect(() => {
        if (openQR === '1') setShowQRScanner(true);
    }, [openQR]);


    // позиция шторки, которую отдаёт Modalize ('initial' | 'top')
    const [sheetPos, setSheetPos] = useState<'initial' | 'top'>('initial');
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['20%', '60%', '90%'], []);
    const mapRef = useRef<CarWashMapHandle>(null);

    const toggleExtra = (id: number) => {
        setSelectedExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const getBasePrice = () => {
        if (!washDetail || selectedBodyId == null) return 0;
        const bp = washDetail.bodyPrices.find((b) => b.bodyId === selectedBodyId);
        return bp?.price ?? 0;
    };

    const getBasePriceQR = () => {
        const detail = qrWashDetail;
        if (!detail) return 0;
        const min = [...detail.bodyPrices].sort((a, b) => a.price - b.price)[0];
        return min?.price ?? 0;
    };
    const getExtrasTotalQR = () =>
        qrWashExtras.filter(e => selectedQrExtras.includes(e.id))
            .reduce((s, e) => s + (e.price || 0), 0);
    const getServiceFee = (_: number) => 0;
    const getGrandTotalQR = () => {
        const base = getBasePriceQR();
        const extras = getExtrasTotalQR();
        const fee = getServiceFee(base + extras);
        return base + extras + fee;
    };

    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const getExtrasTotal = () =>
        washDetail
            ? washDetail.extraServices
                .filter((es) => selectedExtras.includes(es.id))
                .reduce((sum, es) => sum + es.price, 0)
            : 0;

    const calculateTotalPrice = () => getBasePrice() + getExtrasTotal();

    const openedByInputRef = useRef(false);
    const kbHRef = useRef(0);

    const [filtersVisible, setFiltersVisible] = useState(false);
    const [filters, setFilters] = useState<{
        body: string | null;
        extras: string[];
        priceRange: [number, number];
        sortBy: 'distance' | 'rating' | 'price' | null;
        isOpenNow: boolean;
        city: string | null;
    }>({
        body: null,
        extras: [],
        priceRange: [0, 50000],
        sortBy: null,
        isOpenNow: false,
        city: null,
    });

    useEffect(() => {
        if (!qrToken || !pollInfo) return;

        // финальные состояния
        if (['paid', 'closed', 'expired'].includes(pollInfo.status)) {
            stopPoll();
            setExtrasVisible(false);
            const msg =
                pollInfo.status === 'paid' ? 'Оплата прошла успешно!' :
                    pollInfo.status === 'expired' ? 'QR-сессия истекла' : 'Сессия завершена';
            Alert.alert('QR', msg);

            setQrToken(null);
            setQrStatus(null);
            setPollInfo(null);
            setQrWashDetail(null);
            setQrWashExtras([]);
            setSelectedQrExtras([]);
            setQrAmount(null);
            extrasOpenedFor.current = null;
            return;
        }

        // открыть модалку допов при запросе мойки
        if (pollInfo?.status === 'awaiting_extras' && !extrasVisible && extrasOpenedFor.current !== qrToken) {
            extrasOpenedFor.current = qrToken;
            (async () => {
                try {
                    const detail = await fetchCarWashDetail(Number(pollInfo.carWashId));
                    const extras = (detail?.extraServices || []).map((e: any) => ({
                        id: e.id,
                        name: e.name,
                        price: e.price
                    }));
                    setQrWashDetail(detail);
                    setQrWashExtras(extras);
                    const fresh = await reload().catch(() => myBookings);
                    const booking = pickActive(fresh);
                    await prefillExtrasFromBookingAndPoll({
                        token: qrToken!, pollSelectedIds: pollInfo.selected_extra_ids, booking, extrasCatalog: extras,
                    });
                } catch {
                    setQrWashExtras([]);
                    setSelectedQrExtras(pollInfo.selected_extra_ids || []);
                } finally {
                    setExtrasVisible(true);
                }
            })();
        }
    }, [qrToken, pollInfo, extrasVisible]);


    // Синхронизируем “чипы” с сортировкой из модалки (если надо)
    useEffect(() => {
        if (filters.sortBy === 'distance') {
            setSortNearest(true);
            setSortTopRated(false);
        } else if (filters.sortBy === 'rating') {
            setSortNearest(false);
            setSortTopRated(true);
        }
        // price сортируем ниже, по возможности
    }, [filters.sortBy]);

    useEffect(() => {
        const onShow = (e: any) => {
            kbHRef.current = e?.endCoordinates?.height ?? 0;
        };
        const onHide = () => {
            kbHRef.current = 0;
        };

        const showEvt = Platform.select({ios: 'keyboardWillShow', android: 'keyboardDidShow'})!;
        const hideEvt = Platform.select({ios: 'keyboardWillHide', android: 'keyboardDidHide'})!;

        const s1 = Keyboard.addListener(showEvt as KeyboardEventName, onShow);
        const s2 = Keyboard.addListener(hideEvt as KeyboardEventName, onHide);
        return () => {
            s1.remove();
            s2.remove();
        };
    }, []);

    const snapAboveKeyboard = () => {
        const screenH = Dimensions.get('window').height;
        const kbH = kbHRef.current;

        const gap = 12;
        const minH = 260;
        const maxH = screenH * 0.9;

        const target = Math.max(minH, Math.min(maxH, screenH - kbH - gap));

        sheetRef.current?.snapToPosition?.(target);
    };

    useEffect(() => {
        if (!washDetail) return;
        if (washDetail.bodyPrices.length > 0 && selectedBodyId == null) {
            const min = [...washDetail.bodyPrices].sort((a, b) => a.price - b.price)[0];
            setSelectedBodyId(min.bodyId);
        }
    }, [washDetail, selectedBodyId]);

    // тянем детали/боксы/слоты при открытии модалки
    useEffect(() => {
        let alive = true;

        (async () => {
            if (!showBooking || !selectedWash) return;

            try {
                setWashDetail(null);
                setBoxes([]);
                setBoxSlots(null);
                setLoadingSlots(true);

                const detail = await fetchCarWashDetail(Number(selectedWash.id));
                if (!alive) return;
                setWashDetail(detail);

                const bxs = await fetchBoxes(Number(selectedWash.id));
                if (!alive) return;
                setBoxes(bxs);

                const first = bxs.find((x) => x.isAvailable) ?? bxs[0];
                if (first) {
                    setSelectedBoxId(first.id);
                    const slots = await fetchBoxSlots(Number(selectedWash.id), first.id, bookingDate);
                    if (!alive) return;
                    setBoxSlots(slots);
                } else {
                    setBoxSlots(null);
                }
            } catch {
                // no-op
            } finally {
                if (alive) setLoadingSlots(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [showBooking, selectedWash, bookingDate]);

    const reloadSlots = async (washId: number, boxId: number, date: string) => {
        setLoadingSlots(true);
        try {
            const slots = await fetchBoxSlots(washId, boxId, date);
            setBoxSlots(slots);
        } finally {
            setLoadingSlots(false);
        }
    };

    const focusOnMarker = (cw: CarWash) => {
        setSelectedWash(cw);
        setFocusId(cw.id);
        mapRef.current?.focusOn(cw.id, {duration: 600, zoom: 15});

        if (timeoutRef.current) clearTimeout(timeoutRef.current as unknown as number);
        timeoutRef.current = setTimeout(() => {
            setShowBooking(true);
        }, 200) as unknown as number;
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await fetchCarWashes(20, 0);
                if (alive) setWashes(data);
            } catch (e) {
                if (alive) setErr('Не удалось загрузить список автомоек');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const initialCenter =
        (lat && lng)
            ? {latitude: Number(lat), longitude: Number(lng)}
            : {latitude: 43.2383, longitude: 76.9455}; // Almaty по умолчанию

    const [center, setCenter] = useState(initialCenter);


    const openBooking = (cw: CarWash) => {
        setSelectedWash(cw);
        bookingSheetRef.current?.open();
    };

    const matchesCategory = (w: any, cat: typeof category) => {
        if (cat === 'all') return true;

        // 1) Явное поле (если бэк отдаёт)
        const byField =
            (w.category && String(w.category).toLowerCase() === cat) ||
            (w.type && String(w.type).toLowerCase() === cat);

        // 2) По услугам (если нет явного поля)
        const services: string[] = (w.extraServices || w.services || []).map((s: any) =>
            (typeof s === 'string' ? s : s?.name) ?? ''
        );
        const S = new Set(services.map((s) => s.toLowerCase()));

        const byServices =
            (cat === 'car_wash' && (S.has('автомойка') || S.has('car wash')))
            || (cat === 'sto' && (S.has('сто') || S.has('service') || S.has('technical assurance')))
            || (cat === 'tire' && (S.has('шиномонтажка') || S.has('tire') || S.has('tire fitting')))
            || (cat === 'oil' && (S.has('замена масла') || S.has('oil') || S.has('oil change')));

        return Boolean(byField || byServices);
    };

    const filteredWashes = useMemo(() => {
        let arr = washes.filter(
            (w) =>
                w.name.toLowerCase().includes(search.toLowerCase()) ||
                w.address.toLowerCase().includes(search.toLowerCase())
        );
        if (category !== 'all') {
            arr = arr.filter((w) => matchesCategory(w as any, category));
        }
        if (filters.city) {
            const cityLower = filters.city.toLowerCase();
            arr = arr.filter((w) => {
                const fromType: string = (w as any).city ? String((w as any).city) : '';
                const byCity = fromType.toLowerCase().includes(cityLower);
                const byAddress = (w.address || '').toLowerCase().includes(cityLower);
                return byCity || byAddress;
            });
        }

        if (filters.isOpenNow) {
            arr = arr.filter((w) => w.workingHoursDetailed?.is24Hours || w.open_now);
        }

        if (filters.body) {
            arr = arr.filter((w: any) => {
                const supportedBodies: string[] = w.supportedBodies || w.bodyTypes || [];
                return supportedBodies.length ? supportedBodies
                    .map((s) => String(s).toLowerCase())
                    .includes(String(filters.body).toLowerCase()) : true; // нет данных — не режем
            });
        }

        if (filters.extras.length) {
            arr = arr.filter((w: any) => {
                const services: string[] = (w.extraServices || w.services || []).map((s: any) =>
                    (typeof s === 'string' ? s : s?.name) ?? ''
                );
                if (!services.length) return true; // нет данных — пропускаем
                const target = new Set(services.map((s) => s.toLowerCase()));
                return filters.extras.every((e) => target.has(e.toLowerCase()));
            });
        }


        // Цена — если у карточки есть minPrice/maxPrice/avgPrice
        const [minP, maxP] = filters.priceRange;
        if (Number.isFinite(minP) || Number.isFinite(maxP)) {
            arr = arr.filter((w: any) => {
                const price =
                    Number(w.minPrice ?? w.avgPrice ?? w.price ?? NaN);
                if (Number.isNaN(price)) return true; // нет данных — не режем
                return price >= (minP ?? 0) && price <= (maxP ?? Number.MAX_SAFE_INTEGER);
            });
        }

        // Базовый “открыто” свитч в экране
        if (showOpenOnly) {
            arr = arr.filter((w) => w.workingHoursDetailed?.is24Hours || w.open_now);
        }

        // Подготовим расстояние
        const cx = center.latitude;
        const cy = center.longitude;
        const withDist = arr.map((w) => ({
            ...w,
            _dist: haversineKm(cx, cy, w.latitude, w.longitude) || Number.POSITIVE_INFINITY,
        }));

        // Сортировка по модалке приоритетнее чипов
        const sortKey = filters.sortBy;
        const cmp = (a: any, b: any) => {
            if (sortKey === 'distance' || sortNearest) {
                if (a._dist !== b._dist) return a._dist - b._dist;
            }
            if (sortKey === 'rating' || sortTopRated) {
                if (a.rating !== b.rating) return b.rating - a.rating;
            }
            if (sortKey === 'price') {
                const pa = Number(a.minPrice ?? a.avgPrice ?? a.price ?? Number.POSITIVE_INFINITY);
                const pb = Number(b.minPrice ?? b.avgPrice ?? b.price ?? Number.POSITIVE_INFINITY);
                if (pa !== pb) return pa - pb;
            }
            return a.name.localeCompare(b.name);
        };

        return withDist.sort(cmp);
    }, [washes, search, showOpenOnly, sortNearest, sortTopRated, center, filters]);

    const openCatalogToTop = () => {
        const ref: any = catalogSheetRef.current;
        if (!ref) return;
        if (ref.snapTo) ref.snapTo(420);
        else ref.open();
    };

    useEffect(() => {
        if (!selectedCityName) return;

        // 1) применим фильтр по городу (ты уже используешь filters.city)
        setFilters(prev => ({...prev, city: selectedCityName}));

        // 2) центрируем карту
        const next = getCenterByName(selectedCityName);
        if (next) {
            setCenter(next);
            // если нужна анимация зума — дерни метод карты (если поддерживается)
            mapRef.current?.focusOn?.(null, {duration: 500, zoom: 12});
        }
    }, [selectedCityName]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaView edges={['top']} style={{backgroundColor: '#fff'}}>
                <OwnerHeader/>
            </SafeAreaView>
            <View style={{backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 8}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <MapPin size={16} color="#14213D"/>
                    <View style={{flex: 1}}>
                        <SelectList
                            items={cities.map(c => ({id: c.id, name: c.name}))}
                            selectedId={selectedCityId}
                            onSelect={(id) => setSelectedCityId(id)}
                            placeholder="Выбрать город"
                            safeTop={insets.top}
                            triggerStyle={{
                                height: 56,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: '#E6E6E6',
                                backgroundColor: '#F9F9F9',
                                paddingHorizontal: 12,
                                justifyContent: 'center'
                            }}
                            textStyle={{color: '#14213D', fontWeight: '600'}}
                        />
                    </View>
                </View>
            </View>
            <QRScanner
                isVisible={showQRScanner}
                onScan={handleQRScan}
                onClose={() => setShowQRScanner(false)}
            />
            {/* Map */}
            <View style={styles.mapWrap}>
                {loading ? (
                    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                        <ActivityIndicator/>
                        <Text style={{marginTop: 8, color: '#888'}}>Загрузка карты…</Text>
                    </View>
                ) : err ? (
                    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={{color: 'red'}}>{err}</Text>
                    </View>
                ) : (
                    <CarWashMap
                        ref={mapRef}
                        apiKey={GIS_API_KEY}
                        carWashes={washes}
                        center={center}
                        zoom={12}
                        showInfoPopup
                        onMarkerPress={(cw) => focusOnMarker(cw)}
                    />
                )}
            </View>

            {/* Каталог автомоек — снизу */}
            <BottomSheet
                ref={sheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={false}
                keyboardBehavior="extend"
                keyboardBlurBehavior="restore"
                handleIndicatorStyle={{backgroundColor: '#ccc'}}
                backgroundStyle={{backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16}}
                activeOffsetX={[-10, 10]}
            >
                <BottomSheetFlatList
                    data={filteredWashes}
                    keyExtractor={(item: { id: any }) => item.id}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="always"
                    contentContainerStyle={{paddingBottom: 16}}
                    ListHeaderComponent={
                        <>
                            <View style={styles.headerRow}>
                                <TextInput
                                    placeholder="Поиск автомойки..."
                                    placeholderTextColor="#888"
                                    value={search}
                                    onChangeText={setSearch}
                                    onFocus={() => {
                                        const delay = Platform.OS === 'android' ? 120 : 0;
                                        setTimeout(snapAboveKeyboard, delay);
                                    }}
                                    style={styles.searchInput}
                                />
                                <TouchableOpacity
                                    onPress={() => setFiltersVisible(true)}
                                    style={styles.filterBtn} // добавьте в ваш map.styles
                                    accessibilityRole="button"
                                    accessibilityLabel="Открыть фильтры"
                                >
                                    <SlidersHorizontal size={18} color="#FF6B35"/>
                                </TouchableOpacity>
                            </View>
                            <GHScrollView
                                horizontal
                                style={styles.categoriesRow}
                                showsHorizontalScrollIndicator={false}
                            >
                                {[
                                    {key: 'all', label: 'Все'},
                                    {key: 'car_wash', label: 'Автомойка'},
                                    {key: 'sto', label: 'СТО'},
                                    {key: 'tire', label: 'Шиномонтажка'},
                                    {key: 'oil', label: 'Замена Масла'},
                                ].map((c) => (
                                    <TouchableOpacity
                                        key={c.key}
                                        onPress={() => setCategory(c.key as any)}
                                        style={[styles.catChip, category === c.key && styles.catChipActive]}
                                    >
                                        <Text
                                            style={[styles.catChipText, category === c.key && styles.catChipTextActive]}>
                                            {c.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </GHScrollView>
                        </>
                    }
                    //@ts-ignore
                    renderItem={({item}) => {
                        return (
                            <TouchableOpacity style={styles.listItem} onPress={() => focusOnMarker(item)}>
                                <Text style={styles.listName}>{item.name}</Text>
                                <Text style={styles.listAddress}>{item.address}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </BottomSheet>

            <FiltersModal
                visible={filtersVisible}
                onClose={() => setFiltersVisible(false)}
                onApply={(f) => {
                    setFilters(f);
                    setFiltersVisible(false);
                }}
            />

            {/* Панель брони */}
            <BookingModal
                visible={showBooking}
                insetsTop={insets.top}
                selectedWash={
                    selectedWash
                        ? {
                            id: selectedWash.id,
                            image: selectedWash.image,
                            name: selectedWash.name,
                            rating: selectedWash.rating,
                            address: selectedWash.address,
                            workingHours: selectedWash.workingHours,
                        }
                        : null
                }
                washDetail={washDetail}
                boxes={boxes}
                selectedBoxId={selectedBoxId}
                setSelectedBoxId={(id) => setSelectedBoxId(id)}
                loadingSlots={loadingSlots}
                boxSlots={boxSlots}
                bookingDate={bookingDate}
                onReloadSlots={reloadSlots}
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
                    setSelectedWash(null);
                    setSelectedSlot(null);
                    setSelectedExtras([]);
                    setSelectedBodyId(null);
                }}
            />
            <QrExtrasModal
                visible={extrasVisible}
                onClose={() => setExtrasVisible(false)}

                qrWashDetail={qrWashDetail}
                qrWashExtras={qrWashExtras}
                selectedQrExtras={selectedQrExtras}

                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                isUpdatingExtras={isUpdatingExtras}
                isPaying={isPaying}

                toggleQrExtra={toggleQrExtra}
                handlePay={handlePay}

                getBasePriceQR={getBasePriceQR}
                getExtrasTotalQR={getExtrasTotalQR}
                getServiceFee={getServiceFee}
                getGrandTotalQR={getGrandTotalQR}

                pollInfo={pollInfo}
            />

            <BottomNav onOpenQR={() => setShowQRScanner(true)}/>
        </View>
    );
}
