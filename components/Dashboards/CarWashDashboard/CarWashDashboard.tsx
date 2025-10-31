import React, {useEffect, useRef, useMemo, useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Image,
    KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import {usePullToRefresh} from '@/src/hooks/usePullToRefresh';
import {styles} from './CarWashDashboard.styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import ActiveBookingsList from '@/components/Dashboards/CarWashDashboard/BookingAnalytics/ActiveBookingList';
import {fetchDashboardStats, type DashboardStatsResponse} from '@/src/services/api/dashboardApi';
import {API_BASE_URL, GIS_API_KEY} from '@/src/config/env';
import { buildStatsExportUrl, type StatsKind, type ExportFormat } from '@/src/services/api/exportsApi';
import { downloadAndShare } from '@/src/utils/download';


import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view'; // npm i react-native-keyboard-aware-scroll-view
import {
    TrendingUp,
    Users,
    Calendar,
    LogOut,
    QrCode,
    BarChart3,
    ChevronDown,
    User,
    Settings,
    X,
    Phone,
    MapPin,
    Shield,
    Plus,
    Minus,
    Upload, CoinsIcon,
} from 'lucide-react-native';
import {api, useAuth} from '@/contexts/AuthContext';
import {useVisits, type Booking, type HourlyData} from '@/contexts/VisitsContext';
import QRCode from '@/components/QR/QRCode';
import {carWashesAlmaty} from '@/src/data/carWashes';
import {useAuthStore} from '@/src/stores/authStore';
import BookingsAnalytics from '@/components/Dashboards/CarWashDashboard/BookingAnalytics/BookingAnalytics';
import {fetchDashboardBookings} from '@/src/services/api/carWashesApi';
import {
    createQrSession, pollSession, cashApprove,
    type CreateQrSessionResponse
} from '@/src/services/api/qrApi';


// @ts-ignore
import placeholderPhoto1 from '@/assets/images/placeholders/landscape.svg'

import TwoGisSearchModal from '@/components/TwoGisSearchModal';
import {useReferenceData} from '@/src/stores/useReferenceData';

type DashboardBooking = {
    id: number;
    slot_index: number;
    box: number;
    box_name: string;
    client: number;
    client_phone: string;
    client_car_number: string;
    client_car_body: string;
    car_body: number;
    car_body_name: string;
    extra_services: number[];
    total_price: string;       // приходит строкой "2000.00"
    created_at: string;        // ISO с +05:00
};


interface BookingsTrackerProps {
    carWashId: string;
    selectedDate: Date;
    selectedFilter: string;
    showFilters: boolean;
    onDateChange: (date: Date) => void;
    onFilterChange: (filter: string) => void;
    onToggleFilters: () => void;
}


// Простой select-подобный список через Modal
function SelectList<T extends { id: string; name: string }>(
    {
        items,
        selectedId,
        onSelect,
        placeholder = 'Выбрать...',
        safeTop = 0,
        safeBottom = 0,   // 👈 добавили
    }: {
        items: T[];
        selectedId: string | null;
        onSelect: (id: string) => void;
        placeholder?: string;
        safeTop?: number;
        safeBottom?: number;
    }
) {
    const [open, setOpen] = React.useState(false);
    const selected = items.find(i => i.id === selectedId);

    return (
        <View>
            <TouchableOpacity onPress={() => setOpen(true)} style={styles.selectTrigger}>
                <Text style={styles.selectText}>{selected ? selected.name : placeholder}</Text>
                <ChevronDown color="#14213D" size={18}/>
            </TouchableOpacity>

            <Modal
                visible={open}
                animationType="slide"
                statusBarTranslucent
                presentationStyle="fullScreen"
                onRequestClose={() => setOpen(false)}
            >
                <View style={[styles.modalContainer, {paddingTop: Math.max(safeTop, 12)}]}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.mapHeaderTitle}>Выберите из списка</Text>
                        <TouchableOpacity onPress={() => setOpen(false)}
                                          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <X color="#14213D" size={22}/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={[styles.listContent, {paddingBottom: safeBottom + 8}]}>
                        {items.map(it => (
                            <TouchableOpacity
                                key={it.id}
                                onPress={() => {
                                    onSelect(it.id);
                                    setOpen(false);
                                }}
                                style={[styles.listItem, selectedId === it.id && styles.listItemActive]}
                            >
                                <Text style={styles.listItemText}>{it.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}


function BookingsTracker({
                             carWashId,
                             selectedDate,
                             selectedFilter,
                         }: BookingsTrackerProps) {
    const {getBookingsByDate, getHourlyBookings} = useVisits();
    const {user} = useAuth();

    const bookings = useMemo(() => {
        return getBookingsByDate(carWashId, selectedDate, selectedFilter);
    }, [carWashId, selectedDate, selectedFilter, getBookingsByDate]);

    const hourlyData = useMemo(() => {
        return getHourlyBookings(carWashId, selectedDate);
    }, [carWashId, selectedDate, getHourlyBookings]);

    const filterOptions = [
        {key: 'today', label: 'Сегодня'},
        {key: 'week', label: 'Эта неделя'},
        {key: 'month', label: 'Этот месяц'},
        {key: 'all', label: 'Все время'},
    ];

    const getWorkingHours = () => {
        const carWash = carWashesAlmaty.find((cw) => cw.id === carWashId);
        const workingHours = carWash?.workingHoursDetailed || user?.carWashDetails?.workingHours;

        if (!workingHours || workingHours.is24Hours) {
            return Array.from({length: 24}, (_, i) => i);
        }

        const startHour = parseInt(workingHours.start.split(':')[0]);
        let endHour = parseInt(workingHours.end.split(':')[0]);
        const hours: number[] = [];

        if (endHour === 24) {
            for (let hour = startHour; hour < 24; hour++) hours.push(hour);
        } else if (startHour <= endHour) {
            for (let hour = startHour; hour < endHour; hour++) hours.push(hour);
        } else {
            for (let hour = startHour; hour < 24; hour++) hours.push(hour);
            for (let hour = 0; hour < endHour; hour++) hours.push(hour);
        }
        return hours;
    };

    const workingHoursArray = getWorkingHours();

    const getLoadPercentage = (hour: number) => {
        const hourData = hourlyData.find((h: HourlyData) => h.hour === hour);
        const maxCapacity = 4;
        return hourData ? Math.min((hourData.bookings / maxCapacity) * 100, 100) : 0;
    };

    const getLoadColor = (percentage: number) => {
        if (percentage >= 80) return '#FF4444';
        if (percentage >= 60) return '#14213D';
        if (percentage >= 40) return '#FFA500';
        return '#4CAF50';
    };

    const getStatusText = (percentage: number) => {
        if (percentage >= 80) return 'ПЕРЕГРУЖЕНО';
        if (percentage >= 60) return 'ВЫСОКАЯ';
        if (percentage >= 40) return 'СРЕДНЯЯ';
        return 'НИЗКАЯ';
    };


    return (
        <View style={styles.section}>

            <Text style={styles.subsectionTitle}>АКТИВНЫЕ ЗАПИСИ</Text>
            {bookings.length > 0 ? (
                bookings.map((booking: Booking) => (
                    <View key={booking.id} style={styles.bookingCard}>
                        <View style={styles.bookingInfo}>
                            <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
                            <Text style={styles.bookingService}>{booking.service}</Text>
                            <Text style={styles.bookingPhone}>{booking.customerPhone}</Text>
                        </View>
                        <View style={styles.bookingDetails}>
                            <Text style={styles.bookingTime}>
                                {new Date(booking.scheduledTime).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                            <View
                                style={[
                                    styles.bookingStatus,
                                    {
                                        backgroundColor:
                                            booking.status === 'confirmed'
                                                ? '#4CAF50'
                                                : booking.status === 'pending'
                                                    ? '#FFA500'
                                                    : '#FF4444',
                                    },
                                ]}
                            >
                                <Text style={styles.bookingStatusText}>
                                    {booking.status === 'confirmed'
                                        ? 'ПОДТВ.'
                                        : booking.status === 'pending'
                                            ? 'ОЖИД.'
                                            : 'ОТМЕН.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Нет записей на выбранную дату</Text>
                </View>
            )}
        </View>
    );
}

/* ===================  НОВЫЙ ЭКРАН: АДМИН АВТОМОЙКИ  =================== */

type BodyType = { id: string; name: string };
type BaseService = { id: string; name: string };

function CarWashAdminScreen() {
    const user = useAuthStore(s => s.user);
    const placeholderPhoto = placeholderPhoto1;
    const [twoGisPlaceId, setTwoGisPlaceId] = useState<string | null>(null);
    const [placeTitle, setPlaceTitle] = useState<string>('');
    const [placeRating, setPlaceRating] = useState<number | null>(null);
    const [placeAddress, setPlaceAddress] = useState<string>('');
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [placePhotoUrl, setPlacePhotoUrl] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [lat, setLat] = useState<number | null>(null);
    const [lon, setLon] = useState<number | null>(null);
    const insets = useSafeAreaInsets();
    const keyboardOffset = Platform.OS === 'ios' ? insets.top + 56 : 0; // 56 ~ высота шапки; подгони при необходимости
    const [openTime, setOpenTime] = useState<string>('08:00');
    const [closeTime, setCloseTime] = useState<string>('22:00');
    const [openTimeError, setOpenTimeError] = useState<string | null>(null);
    const [closeTimeError, setCloseTimeError] = useState<string | null>(null);

    const validateTime = (time: string): boolean => {
        if (!/^\d{2}:\d{2}$/.test(time)) return false;
        const [hh, mm] = time.split(':').map(Number);
        return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
    };


    const closeTimeRef = useRef<TextInput>(null);

    const formatTime = (text: string) => {
        // оставляем только цифры
        const digits = text.replace(/\D/g, '').slice(0, 4);

        if (digits.length <= 2) return digits;
        return digits.slice(0, 2) + ':' + digits.slice(2);
    };

    const handleOpenTimeChange = (text: string) => {
        const formatted = formatTime(text);
        setOpenTime(formatted);

        if (formatted.length === 5) {
            if (!validateTime(formatted)) {
                setOpenTimeError('Некорректное время (должно быть 00–23:00–59)');
            } else {
                setOpenTimeError(null);
                closeTimeRef.current?.focus();
            }
        }
    };

    const handleCloseTimeChange = (text: string) => {
        const formatted = formatTime(text);
        setCloseTime(formatted);

        if (formatted.length === 5) {
            if (!validateTime(formatted)) {
                setCloseTimeError('Некорректное время (должно быть 00–23:00–59)');
            } else {
                setCloseTimeError(null);
            }
        }
    };
    // PATCH: helpers для multipart
    const isLocalUri = (u?: string | null) =>
        !!u && (u.startsWith('file://') || u.startsWith('content://'));

    const buildSetupForm = (p: {
        car_wash_id: number;
        name: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        two_gis_id?: string | null;
        open_time?: string;   // "HH:MM:SS"
        close_time?: string;  // "HH:MM:SS"
        boxes: any[];
        body_prices: any[];
        extra_services: any[];
        imgUri?: string | null;
    }) => {
        const form = new FormData();
        form.append('car_wash_id', String(p.car_wash_id));
        form.append('name', p.name);
        if (p.address) form.append('address', p.address);
        if (p.latitude != null) form.append('latitude', String(p.latitude));
        if (p.longitude != null) form.append('longitude', String(p.longitude));
        if (p.two_gis_id != null) form.append('two_gis_id', p.two_gis_id);
        if (p.open_time) form.append('open_time', p.open_time);
        if (p.close_time) form.append('close_time', p.close_time);

        form.append('boxes', JSON.stringify(p.boxes || []));
        form.append('body_prices', JSON.stringify(p.body_prices || []));
        form.append('extra_services', JSON.stringify(p.extra_services || []));

        if (isLocalUri(p.imgUri)) {
            form.append('img', {
                uri: p.imgUri!,
                name: `carwash_${Date.now()}.jpg`,
                type: 'image/jpeg',
            } as any);
        }
        return form;
    };


    const {
        carBodyTypes,
        extraServices,
        loading: refLoading,
        error: refError,
        load: loadRefs,
    } = useReferenceData();

    useEffect(() => {
        loadRefs();
    }, [loadRefs]);

    useEffect(() => {
        setBodyTypes(carBodyTypes.map((b) => ({id: String(b.id), name: b.name})));
        setBaseServices(extraServices.map((s) => ({id: String(s.id), name: s.name})));
        // автоселект первого пункта, если не выбран
        setSelectedBodyId((prev) => prev ?? (carBodyTypes[0] ? String(carBodyTypes[0].id) : null));
        setSelectedBaseServiceId((prev) => prev ?? (extraServices[0] ? String(extraServices[0].id) : null));
    }, [carBodyTypes, extraServices]);

    useEffect(() => {
        const fetchCarWash = async () => {
            try {
                if (!user?.id) return;
                const carWashId = user?.carWashDetails?.id ?? user?.id;
                const { data } = await api.get(`/dashboard/carwashes/${carWashId}/`, {
                    baseURL: API_BASE_URL,     // 👈 без /api
                });

                if (data.name) setPlaceTitle(data.name);
                if (data.address) setPlaceAddress(data.address);
                if (data.latitude) setLat(Number(data.latitude));
                if (data.longitude) setLon(Number(data.longitude));
                if (data.two_gis_id) setTwoGisPlaceId(data.two_gis_id);
                if (data.img) setPlacePhotoUrl(data.img);

                if (Array.isArray(data.boxes)) {
                    setWashBays(data.boxes.length);
                }

                if (Array.isArray(data.body_prices)) {
                    const bodyMap: Record<string, string> = {};
                    data.body_prices.forEach((bp: any) => {
                        bodyMap[String(bp.car_body)] = String(bp.price);
                    });
                    setPricesByBody(bodyMap);
                    setChosenBodyIds(Object.keys(bodyMap));
                }

                if (Array.isArray(data.extra_services)) {
                    const svcMap: Record<string, string> = {};
                    data.extra_services.forEach((es: any) => {
                        svcMap[String(es.service_id)] = String(es.price);
                    });
                    setBasePrices(svcMap);
                    setChosenBaseServiceIds(Object.keys(svcMap));
                }
            } catch (e) {
                console.error("Ошибка загрузки автомойки:", e);
            }
        };

        fetchCarWash();
    }, [user?.id,]);


    const [bodyTypes, setBodyTypes] = useState<{ id: string; name: string }[]>([]);
    const [baseServices, setBaseServices] = useState<{ id: string; name: string }[]>([]);

    const handlePickFromSearch = (p: {
        id: string; name: string; address?: string; rating?: number | null;
        latitude?: number | null; longitude?: number | null; photoUrl?: string | null;
    }) => {
        setTwoGisPlaceId(p.id);
        if (typeof p.rating === 'number') setPlaceRating(p.rating);
        if (p.address) setPlaceAddress(p.address);
        if (p.photoUrl) setPlacePhotoUrl(p.photoUrl);
        // при желании сохраняем и координаты
        setLat(p.latitude ?? null);
        setLon(p.longitude ?? null);
    };

    const onPlacePicked = async (p: { id: string; name?: string; rating?: number; address?: string }) => {
        setTwoGisPlaceId(p.id);
        setIsMapOpen(false);

        try {
            const res = await fetch(`https://catalog.api.2gis.com/3.0/items/byid?id=${p.id}&key=${GIS_API_KEY}`);
            const data = await res.json();

            if (data?.result?.items?.length) {
                const item = data.result.items[0];
                setPlaceAddress(item.address_name ?? "");
                if (item.photos?.[0]?.url) {
                    setPlacePhotoUrl(item.photos[0].url); // если есть фото в каталоге
                }
            }
        } catch (e) {
            console.error("Ошибка получения адреса по ID:", e);
        }
    };


    // Боксы
    const [washBays, setWashBays] = useState<number>(1);

    // Типы кузовов (с бэка)
    const [pricesByBody, setPricesByBody] = useState<Record<string, string>>({}); // id -> price

    // Базовые услуги (с бэка)
    const [basePrices, setBasePrices] = useState<Record<string, string>>({}); // id -> price

    // Кастомные доп. услуги
    const [customServices, setCustomServices] = useState<{ id: string; name: string; price: string }[]>([]);
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');

    // выбор в дропдаунах
    const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
    const [selectedBaseServiceId, setSelectedBaseServiceId] = useState<string | null>(null);

    // какие строки реально добавлены в таблицу цен
    const [chosenBodyIds, setChosenBodyIds] = useState<string[]>([]);
    const [chosenBaseServiceIds, setChosenBaseServiceIds] = useState<string[]>([]);

    // кнопки "Добавить" и удаление строки
    const addBodyRow = () => {
        if (selectedBodyId && !chosenBodyIds.includes(selectedBodyId)) {
            setChosenBodyIds((prev) => [...prev, selectedBodyId]);
        }
    };

    const removeBodyRow = (id: string) => {
        setChosenBodyIds((prev) => prev.filter((x) => x !== id));
        setPricesByBody((prev) => {
            const updated = {...prev};
            delete updated[id];
            return updated;
        });
    };

    const addBaseServiceRow = () => {
        if (selectedBaseServiceId && !chosenBaseServiceIds.includes(selectedBaseServiceId)) {
            setChosenBaseServiceIds((prev) => [...prev, selectedBaseServiceId]);
        }
    };

    const removeBaseServiceRow = (id: string) => {
        setChosenBaseServiceIds((prev) => prev.filter((x) => x !== id));
        setBasePrices((prev) => {
            const updated = {...prev};
            delete updated[id];
            return updated;
        });
    };


    const openMap = () => setIsMapOpen(true);
    const closeMap = () => setIsMapOpen(false);

    const onPickCustomPhoto = async () => {
        try {
            const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 2],
                quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                const manipulated = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{resize: {width: 1200}}],
                    {compress: 0.8, format: ImageManipulator.SaveFormat.JPEG},
                );
                setPlacePhotoUrl(manipulated.uri);
            }
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось выбрать фото');
        }
    };

    const addBay = () => setWashBays((v) => v + 1);
    const removeBay = () => setWashBays((v) => Math.max(1, v - 1));

    const setBodyPrice = (id: string, value: string) =>
        setPricesByBody((prev) => ({...prev, [id]: value.replace(/[^\d]/g, '')}));

    const setBaseServicePrice = (id: string, value: string) =>
        setBasePrices((prev) => ({...prev, [id]: value.replace(/[^\d]/g, '')}));

    const addCustomService = () => {
        const name = newServiceName.trim();
        const price = newServicePrice.trim().replace(/[^\d]/g, '');
        if (!name || !price) {
            Alert.alert('Заполните поля', 'Введите название и цену');
            return;
        }
        setCustomServices((prev) => [...prev, {id: `${Date.now()}`, name, price}]);
        setNewServiceName('');
        setNewServicePrice('');
    };

    const removeCustomService = (id: string) =>
        setCustomServices((prev) => prev.filter((s) => s.id !== id));

    const payload = {
        place: {
            twoGisPlaceId, // ← только его шлём на бэк
            // ниже — чисто для локального UI/кабина: можно отправлять или нет, по твоему решению
            title: placeTitle || undefined,
            rating: placeRating ?? undefined,
            // address/photoUrl — по желанию, но бэку они не нужны для идентификации
        },
        washBays,
        pricesByBody,
        basePrices,
        customServices,
    };

    const saveAll = async () => {
        if (!twoGisPlaceId) return Alert.alert('Выберите точку', 'Сначала выберите объект в 2ГИС');
        if (!placeTitle.trim()) return Alert.alert('Название', 'Введите название автомойки');
        if (washBays < 1) return Alert.alert('Количество боксов', 'Укажите минимум 1 бокс');

        const carWashIdNum = Number(user?.id);
        if (!carWashIdNum || Number.isNaN(carWashIdNum)) {
            return Alert.alert('Ошибка', 'Не найден car_wash_id пользователя');
        }

        const boxes = Array.from({length: Math.max(0, washBays)}, (_, i) => ({
            name: `Бокс ${i + 1}`,
            is_available: true,
        }));

        const body_prices = Object.entries(pricesByBody)
            .map(([id, priceStr]) => ({car_body: Number(id), price: Number(priceStr)}))
            .filter(it => it.car_body && !Number.isNaN(it.price) && it.price > 0);

        const extra_services = Object.entries(basePrices)
            .map(([id, priceStr]) => ({service_id: Number(id), price: Number(priceStr)}))
            .filter(it => it.service_id && !Number.isNaN(it.price) && it.price > 0);

        if (chosenBodyIds.length === 0) {
            return Alert.alert('Ошибка', 'Добавьте хотя бы один тип кузова с ценой');
        }
        const invalidBodies = chosenBodyIds.filter(id => !pricesByBody[id] || Number(pricesByBody[id]) <= 0);
        if (invalidBodies.length > 0) {
            return Alert.alert('Ошибка', 'Введите цену для всех выбранных типов кузова');
        }

        const form = buildSetupForm({
            car_wash_id: carWashIdNum,
            name: placeTitle.trim(),
            address: placeAddress,
            latitude: typeof lat === 'number' ? lat : 0,
            longitude: typeof lon === 'number' ? lon : 0,
            two_gis_id: twoGisPlaceId,
            open_time: openTime + ':00',
            close_time: closeTime + ':00',
            boxes,
            body_prices,
            extra_services,
            // отправляем файл только если это локальная картинка, выбранная пользователем
            imgUri: placePhotoUrl ?? null,
        });

        console.log(form);

        try {
            const res = await api.postForm(`/dashboard/carwash/setup/`, form, {
                baseURL: API_BASE_URL,     // 👈 без /api
            });
            const data = res?.data ?? {};

            if (data?.img) {
                setPlacePhotoUrl(String(data.img));
            }
            Alert.alert('Сохранено', 'Настройки автомойки обновлены');

        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ||
                e?.response?.data?.message ||
                (typeof e?.response?.data === 'string' ? e.response.data : '') ||
                e?.message ||
                'Не удалось сохранить';
            Alert.alert('Ошибка сохранения', String(msg));
        }
    };


    return (
        <View style={styles.flex1}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={keyboardOffset}
            >
                <KeyboardAwareScrollView
                    contentContainerStyle={styles.adminScrollContent}
                    keyboardShouldPersistTaps="handled"
                    enableOnAndroid={true}
                    extraScrollHeight={80}
                    enableResetScrollToCoords={false}
                >
                    <Text style={styles.blockTitle}>Адрес и данные</Text>

                    <View style={styles.card}>
                        <View style={styles.gap12}>
                            <TouchableOpacity style={[styles.primaryBtn, styles.primaryBtnWide]}
                                              onPress={() => setIsMapOpen(true)}>
                                <MapPin color="#fff" size={18}/>
                                <Text style={[styles.primaryBtnText, styles.textWhite]}>Выбрать на карте</Text>
                            </TouchableOpacity>

                        </View>
                        <View style={[styles.gap12, styles.mb8]}>
                            <Text style={styles.label}>Название автомойки</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Введите название (например, Wash&Go)"
                                placeholderTextColor="#666"
                                value={placeTitle}
                                onChangeText={setPlaceTitle}
                            />
                        </View>


                        <View style={styles.gap12}>

                            <View style={[styles.rowBetween, styles.mt8, styles.mb8]}>
                                <Text style={styles.label}>Адрес</Text>
                                <Text style={styles.value} numberOfLines={2}>
                                    {placeAddress || '—'}
                                </Text>
                            </View>
                            <View style={styles.gap8}>
                                <Text style={styles.label}>Фото</Text>
                                <Image
                                    source={placePhotoUrl ? {uri: placePhotoUrl} : placeholderPhoto1}
                                    style={styles.photo}
                                />
                                <TouchableOpacity style={styles.secondaryBtn} onPress={onPickCustomPhoto}>
                                    <Upload color="#14213D" size={16}/>

                                    <Text style={styles.secondaryBtnTextPrimary}>Загрузить своё фото</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>Рабочее время</Text>
                        <View style={styles.rowBetween}>
                            <View style={{flex: 1, marginRight: 8}}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        openTimeError && {borderColor: 'red'}
                                    ]}
                                    value={openTime}
                                    placeholder="ЧЧ:ММ"
                                    onChangeText={handleOpenTimeChange}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    returnKeyType="next"
                                />
                                {openTimeError && <Text style={{color: 'red', fontSize: 12}}>{openTimeError}</Text>}
                            </View>

                            <View style={{flex: 1}}>
                                <TextInput
                                    ref={closeTimeRef}
                                    style={[
                                        styles.input,
                                        closeTimeError && {borderColor: 'red'}
                                    ]}
                                    value={closeTime}
                                    placeholder="ЧЧ:ММ"
                                    onChangeText={handleCloseTimeChange}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    returnKeyType="done"
                                />
                                {closeTimeError && <Text style={{color: 'red', fontSize: 12}}>{closeTimeError}</Text>}
                            </View>
                        </View>
                    </View>

                    <Text style={styles.blockTitle}>Количество боксов</Text>
                    <View style={styles.card}>
                        <View style={styles.counterRow}>
                            <TouchableOpacity onPress={removeBay} style={styles.counterBtn}>
                                <Minus color="#fff" size={18}/>
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{washBays}</Text>
                            <TouchableOpacity onPress={addBay} style={styles.counterBtn}>
                                <Plus color="#fff" size={18}/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.blockTitle}>Цены по типам кузова</Text>
                    <View style={styles.mb8}>
                        <View style={styles.rowCenterGap12}>
                            <View style={styles.flex1}>
                                <SelectList
                                    items={bodyTypes}
                                    selectedId={selectedBodyId}
                                    onSelect={(id) => setSelectedBodyId(id)}
                                    placeholder="Выбрать кузов"
                                    safeTop={insets.top}
                                    safeBottom={insets.bottom}
                                />

                            </View>
                            <TouchableOpacity style={styles.primaryBtn} onPress={addBodyRow}>
                                <Plus color="#fff" size={16}/>
                                <Text style={[styles.primaryBtnText, styles.additionBtn]}>Добавить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.gap12}>
                            {chosenBodyIds.map((id) => {
                                const bt = bodyTypes.find((b) => b.id === id);
                                if (!bt) return null;
                                return (
                                    <View key={id} style={styles.priceRow}>
                                        <Text style={styles.label}>{bt.name}</Text>
                                        <View style={styles.priceRow}>
                                            <TextInput
                                                style={[
                                                    styles.priceInput,
                                                    (!pricesByBody[id] || Number(pricesByBody[id]) <= 0) && {borderColor: 'red'}
                                                ]}
                                                placeholder="Цена, ₸"
                                                keyboardType="numeric"
                                                value={pricesByBody[id] || ''}
                                                onChangeText={(v) => setBodyPrice(id, v)}
                                            />

                                            <TouchableOpacity onPress={() => removeBodyRow(id)}
                                                              style={styles.counterBtn}>
                                                <X color="#fff" size={16}/>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                    <Text style={styles.blockTitle}>Дополнительные услуги</Text>
                    <View style={styles.mb8}>
                        <View style={styles.rowCenterGap12}>
                            <View style={styles.flex1}>
                                <SelectList
                                    items={baseServices}
                                    selectedId={selectedBaseServiceId}
                                    onSelect={(id) => setSelectedBaseServiceId(id)}
                                    placeholder="Выбрать услугу"
                                    safeTop={insets.top}         // 👈 сюда
                                    safeBottom={insets.bottom}   // 👈 и сюда
                                />
                            </View>
                            <TouchableOpacity style={styles.primaryBtn} onPress={addBaseServiceRow}>
                                <Plus color="#fff" size={16}/>
                                <Text style={styles.primaryBtnText}>Добавить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.gap12}>
                            {chosenBaseServiceIds.map((id) => {
                                const svc = baseServices.find((s) => s.id === id);
                                if (!svc) return null;
                                return (
                                    <View key={id} style={styles.priceRow}>
                                        <Text style={styles.label}>{svc.name}</Text>
                                        <View style={styles.priceRow}>
                                            <TextInput
                                                style={styles.priceInput}
                                                placeholder="Цена, ₸"
                                                keyboardType="numeric"
                                                value={basePrices[id] || ''}
                                                onChangeText={(v) => setBaseServicePrice(id, v)}
                                            />
                                            <TouchableOpacity onPress={() => removeBaseServiceRow(id)}
                                                              style={styles.counterBtn}>
                                                <X color="#fff" size={16}/>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveAllBtn, washBays < 1 && {opacity: 0.5}]}
                        onPress={saveAll}
                        disabled={washBays < 1}
                    >
                        <Text style={styles.saveAllText}>Сохранить изменения</Text>
                    </TouchableOpacity>
                </KeyboardAwareScrollView>
            </KeyboardAvoidingView>
            <TwoGisSearchModal
                visible={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                apiKey={GIS_API_KEY}
                onConfirm={(p) => {
                    if (p.id) setTwoGisPlaceId(p.id);
                    if (p.address) setPlaceAddress(p.address);
                    if (typeof p.latitude === 'number') setLat(p.latitude);
                    if (typeof p.longitude === 'number') setLon(p.longitude);
                    setIsMapOpen(false);
                }}
            />
        </View>
    );
}

//CarWashDashboard
export default function CarWashDashboard() {
    const [selectedTab, setSelectedTab] = useState<'dashboard' | 'qr' | 'bookings' | 'carwash' | 'analytics'>('bookings');
    const activeBookingsRef = useRef<() => Promise<any> | void>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedFilter, setSelectedFilter] = useState('today');
    const [showFilters, setShowFilters] = useState(false);
    const [showNotificationsSettings, setShowNotificationsSettings] = useState(false);
    const [showSecuritySettings, setShowSecuritySettings] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const {user, logout} = useAuth();
    const {getCarWashStats, getRecentVisits} = useVisits();
    const insets = useSafeAreaInsets();
    // формат для UI и «цифры для API/QR» из стора
    const phoneFormatted = useAuthStore(s => s.getUserPhoneFormatted());
    const phoneDigits = useAuthStore.getState().getUserPhoneDigits();
    const [statsFrom, setStatsFrom] = useState<Date | null>(null);
    const [statsTo, setStatsTo] = useState<Date | null>(null);
    const carWashId = user?.id || 'default';
    const stats = getCarWashStats(carWashId);
    const recentVisits = getRecentVisits(carWashId, 5);
    const [bookingsSubTab, setBookingsSubTab] = useState<'active' | 'analytics'>('active');
    const [exporting, setExporting] = useState(false);
    const [exportJobId, setExportJobId] = useState<string | null>(null);
    const exportPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [statsKind, setStatsKind] = useState<StatsKind>('day');
    const currentYear = new Date().getFullYear();

    // --- QR session state ---
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState<string | null>(null);
    const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
    const [qrSecLeft, setQrSecLeft] = useState<number>(0);

    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const qrActiveRef = useRef(false);
    const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    // QR-сессия
    const [qrCreating, setQrCreating] = useState(false);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [qrUrl, setQrUrl] = useState<string | null>(null);         // для QR-картинки
    const [qrStatus, setQrStatus] = React.useState<string | null>('initiated');
    const [expiresIn, setExpiresIn] = useState<number | null>(null);  // сек. до истечения
    const [qrSess, setQrSess] = React.useState<CreateQrSessionResponse | null>(null);
    const stopPoll = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };
    const [dashStats, setDashStats] = useState<DashboardStatsResponse | null>(null);
    const [dashLoading, setDashLoading] = useState(false);

    const stat = dashStats?.[0] ?? {
        today_visits: 0,
        avg_daily_visits: 0,
        today_load_percent: 0,
        avg_daily_load_percent: 0,
    };

    const rng = dashStats?.[1] ?? {
        range: {kind: 'day', start: '', end_inclusive: ''},
        visits: 0,
        revenue: '0.00',
        load_percent: 0,
        boxes: [],
    };


    const [lastStatsParams, setLastStatsParams] =
        useState<Parameters<typeof fetchDashboardStats>[1] | undefined>({ kind: 'day' });

    const loadDashboardStats = async (p?: Parameters<typeof fetchDashboardStats>[1]) => {

        try {
            setDashLoading(true);
            const params = p ?? lastStatsParams ?? {preset: 'today'};
            setLastStatsParams(params);
            const data = await fetchDashboardStats(params);
            setDashStats(data);
        } finally {
            setDashLoading(false);
        }
    };


// быстрый помощник
    const isoKZ = (d: Date) =>
        new Date(d).toLocaleDateString('en-CA', {timeZone: 'Asia/Almaty'}); // YYYY-MM-DD

    const getCustomRange = () => {
        const start = isoKZ(statsFrom ?? new Date());
        const end = isoKZ(statsTo ?? statsFrom ?? new Date());
        return { start, end };
    };


    const refreshCarWash = async () => {
        try {
            if (selectedTab === 'dashboard') {
                if (statsKind === 'custom') {
                    const { start, end } = getCustomRange();
                    await loadDashboardStats({ kind: 'custom', start, end });
                } else if (statsKind === 'year') {
                    await loadDashboardStats({ kind: 'year', year: currentYear });
                } else {
                    await loadDashboardStats({ kind: statsKind }); // day|week|month
                }
            } else if (selectedTab === 'bookings') {
                await loadDashBookings();
            } else if (selectedTab === 'qr') {
                await generateQrSession();
            }
        } catch {}
    };

    useEffect(() => {
        if (selectedTab === 'dashboard') {
            loadDashboardStats({kind: 'day'});
        }
    }, [selectedTab]);

    useEffect(() => {
        if (selectedTab === 'dashboard') {
            const today = new Date();
            setStatsFrom(today);
            setStatsTo(today);
            loadDashboardStats({kind: 'custom', start: isoKZ(today), end: isoKZ(today)});
        }
    }, [selectedTab]);

    const {refreshing, onRefresh} = usePullToRefresh([
        refreshCarWash,
        () => activeBookingsRef.current?.(), // 👈 дергаем список
    ]);
    const startPoll = (token: string) => {
        stopPoll();
        const tick = async () => {
            try {
                const s = await pollSession(token);
                setQrStatus(s.status || 'initiated');
                // здесь можешь ещё отобразить сумму/допы, если надо администратору
            } catch {
            }
        };
        tick();
        pollRef.current = setInterval(tick, 1500);
    };

    React.useEffect(() => () => stopPoll(), []);

    const createSession = async () => {
        setQrCreating(true);
        try {
            const s = await createQrSession();
            setQrToken(s.token);
            setQrUrl(s.qr_url);             // типа "washly://qr/<token>"
            setQrStatus(s.status);          // "initiated"
            setExpiresIn(
                Math.max(0, Math.floor((new Date(s.expires_at).getTime() - Date.now()) / 1000))
            );
            startPoll(s.token);
        } catch (e: any) {
            Alert.alert('QR', e?.message ?? 'Не удалось создать сессию');
        } finally {
            setQrCreating(false);
        }
    };

    const resetSession = async () => {
        stopPoll();
        setQrToken(null);
        setQrUrl(null);
        setQrStatus(null);
        setExpiresIn(null);
        await createSession();
    };

    const [approving, setApproving] = React.useState(false);

    const approveCash = async () => {
        if (!qrToken || approving) return;
        try {
            setApproving(true);
            await cashApprove(qrToken);
            // Опционально сразу обновим статус локально, а poll подхватит окончательно:
            setQrStatus('paid');
            Alert.alert('Готово', 'Оплата наличными подтверждена');
        } catch (e: any) {
            Alert.alert('Ошибка', e?.message ?? 'Подтверждение не прошло');
        } finally {
            setApproving(false);
        }
    };


// приятный формат таймера
    const fmt = (sec?: number | null) => {
        if (sec == null || sec < 0) return '—';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };


    const cleanupTimers = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        } // 👈 ВАЖНО
    };

    const startTick = (expiresISO: string) => {
        if (tickRef.current) clearInterval(tickRef.current);
        const expiresMs = new Date(expiresISO).getTime();
        const tick = () => {
            const left = Math.ceil((expiresMs - Date.now()) / 1000);
            setQrSecLeft(left);
            if (left <= 0) {
                // истекло — сразу создаём новую сессию
                generateQrSession();
            }
        };
        tick();
        tickRef.current = setInterval(tick, 1000);
    };


    const generateQrSession = async () => {


        setQrLoading(true);
        setQrError(null);

        cleanupTimers(); // 👈 не накапливаем таймеры

        try {
            const s = await createQrSession();
            setQrToken(s.token || null);
            setQrUrl(s.qr_url || null);
            setQrExpiresAt(s.expires_at || null);
            setQrStatus(s.status || 'initiated');

            if (s.expires_at) startTick(s.expires_at);
            if (s.token && qrActiveRef.current) startPoll(s.token); // 👈 только если реально на QR
        } catch (e: any) {
            setQrError(e?.message ?? 'Не удалось создать QR-сессию');
        } finally {
            setQrLoading(false);
        }
    };


    useEffect(() => {
        qrActiveRef.current = (selectedTab === 'qr');

        if (qrActiveRef.current) {
            // заходим на QR — создаём/обновляем сессию
            generateQrSession();
        } else {
            // ушли с QR — гасим все таймеры/поллинг
            cleanupTimers();
        }

        return () => cleanupTimers(); // safety на анмаунте
    }, [selectedTab]);

    const stopExportPolling = () => {
        if (exportPollRef.current) {
            clearInterval(exportPollRef.current);
            exportPollRef.current = null;
        }
    };
    useEffect(() => () => stopExportPolling(), []);

    const handleExport = async (format: ExportFormat) => {
        try {
            setExporting(true);

            let url: string;
            let filename: string;

            if (statsKind === 'custom') {
                const { start, end } = getCustomRange();
                url = buildStatsExportUrl({ kind: 'custom', start, end, format });
                filename = `stats_${start}_${end}.${format}`;
            } else if (statsKind === 'year') {
                url = buildStatsExportUrl({ kind: 'year', year: currentYear, format });
                filename = `stats_${currentYear}.${format}`;
            } else {
                url = buildStatsExportUrl({ kind: statsKind, format });
                filename = `stats_${statsKind}.${format}`;
            }

            await downloadAndShare(url, filename);
            Alert.alert('Готово', 'Файл сохранён/поделен.');
        } catch (e: any) {
            Alert.alert('Экспорт', e?.message ?? 'Не удалось скачать файл');
        } finally {
            setExporting(false);
        }
    };


// === Брони для хедера ===
    type DashboardBooking = {
        id: number;
        slot_index: number;
        box: number;
        box_name: string;
        client: number;
        client_phone: string;
        client_car_number: string;
        client_car_body: string;
        car_body: number;
        car_body_name: string;
        extra_services: number[];
        total_price: string;
        created_at: string;
    };

    const [dashBookings, setDashBookings] = useState<DashboardBooking[]>([]);
    const [loadingDashBookings, setLoadingDashBookings] = useState(false);

    const KZ_TZ = 'Asia/Almaty';
    const dateKeyKZ = (d: Date | string) =>
        new Date(d).toLocaleDateString('en-CA', {timeZone: KZ_TZ}); // YYYY-MM-DD

    const timeHHMMKZ = (iso: string) =>
        new Date(iso).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit', timeZone: KZ_TZ});

    const loadDashBookings = async () => {
        if (!user?.id) return;
        try {
            setLoadingDashBookings(true);
            const data = await fetchDashboardBookings(Number(user.id));
            setDashBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            console.log('fetchDashboardBookings error', e);
        } finally {
            setLoadingDashBookings(false);
        }
    };

    useEffect(() => {
        if (selectedTab !== 'bookings') return;
        loadDashBookings();
        const id = setInterval(loadDashBookings, 30000);
        return () => clearInterval(id);
    }, [selectedTab, user?.id]);

    const todayKey = dateKeyKZ(new Date());
    const todayBookings = useMemo(
        () => dashBookings.filter(b => dateKeyKZ(b.created_at) === todayKey),
        [dashBookings, todayKey]
    );


    const handleLogout = () => logout();


    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.profileIcon} onPress={() => setSelectedTab('carwash')}>
                        <User color="#14213D" size={24}/>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>
                            {user?.carWashDetails?.name?.trim() || 'АДМИН ПАНЕЛЬ'}
                        </Text>
                        <Text style={styles.phone}>{phoneFormatted || '—'}</Text>
                        {user?.carWashDetails?.address && (
                            <Text style={styles.address}>{user.carWashDetails.address}</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <LogOut color="#14213D" size={24}/>
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            <View style={[styles.flex1, styles.mt30]}>
                {selectedTab === 'dashboard' && (
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={{paddingBottom: 96 + insets.bottom}}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#14213D"
                            />
                        }
                    >
                        <BookingsAnalytics
                            carWashId={carWashId}
                            selectedDate={selectedDate}
                            selectedFilter={selectedFilter}
                            showFilters={showFilters}
                            selectedFromDate={statsFrom}
                            selectedToDate={statsTo}
                            onDateChange={setSelectedDate}
                            onFilterChange={setSelectedFilter}
                            onToggleFilters={() => setShowFilters(v => !v)}
                            onRangeChange={(from, to) => {
                                setStatsFrom(from);
                                setStatsTo(to);
                                setStatsKind('custom'); // 👈 переключаем режим
                                loadDashboardStats({ kind: 'custom', start: isoKZ(from), end: isoKZ(to) });
                            }}


                        />
                        <View style={[styles.segmentContainer, { marginTop: 8 }]}>
                            {(['day','week','month','year'] as const).map(k => (
                                <TouchableOpacity
                                    key={k}
                                    style={[styles.segmentBtn, statsKind === k && styles.segmentBtnActive]}
                                    onPress={() => {
                                        setStatsKind(k);
                                        if (k === 'day')   loadDashboardStats({ kind: 'day'   });
                                        if (k === 'week')  loadDashboardStats({ kind: 'week'  });
                                        if (k === 'month') loadDashboardStats({ kind: 'month' });
                                        if (k === 'year')  loadDashboardStats({ kind: 'year', year: currentYear });
                                        // custom — только через выбор в календаре
                                    }}
                                >
                                    <Text style={[styles.segmentText, statsKind === k && styles.segmentTextActive]}>
                                        {k === 'day' ? 'День' : k === 'week' ? 'Неделя' : k === 'month' ? 'Месяц' : 'Год' }
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.statsGrid}>

                            <View style={styles.statCard}>
                                <Users color="#14213D" size={24}/>
                                <Text style={styles.statNumber}>{stat.today_visits}</Text>
                                <Text style={styles.statLabel}>Визитов сегодня</Text>
                            </View>

                            <View style={styles.statCard}>
                                <CoinsIcon color="#14213D" size={24}/>
                                <Text style={styles.statNumber}>
                                    {Number(rng.revenue).toLocaleString()}₸
                                </Text>
                                <Text style={styles.statLabel}>Доход (диапазон)</Text>
                            </View>

                            <View style={styles.statCard}>
                                <TrendingUp color="#14213D" size={24}/>
                                <Text style={styles.statNumber}>{rng.visits}</Text>
                                <Text style={styles.statLabel}>Визитов (диапазон)</Text>
                            </View>

                            <View style={styles.statCard}>
                                <Calendar color="#14213D" size={24}/>
                                <Text style={styles.statNumber}>{stat.avg_daily_visits}</Text>
                                <Text style={styles.statLabel}>Сред./день</Text>
                            </View>
                            {!!rng.boxes?.length && (
                                <View style={styles.card}>
                                    <Text style={styles.subsectionTitle}>ПО БОКСАМ</Text>
                                    {rng.boxes.map((b) => (
                                        <View key={b.box_id} style={[styles.rowBetween, {paddingVertical: 6}]}>
                                            <Text style={styles.label}>{b.box_name}</Text>
                                            <View style={{flexDirection: 'row', gap: 12}}>
                                                <Text style={styles.value}>{b.visits} виз.</Text>
                                                <Text style={styles.value}>{Number(b.revenue).toLocaleString()}₸</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                        {/* Кнопки экспорта */}
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12 }}>
                            <TouchableOpacity
                                style={[styles.primaryBtn, { flex: 1 }, exporting && { opacity: 0.6 }]}
                                onPress={() => handleExport('xlsx')}
                                disabled={exporting}
                            >
                                <Text style={[styles.downloadBtnText, styles.textWhite]}>
                                    {exporting ? 'Готовим…' : 'Выгрузить Excel'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryBtn, { flex: 1 }, exporting && { opacity: 0.6 }]}
                                onPress={() => handleExport('pdf')}
                                disabled={exporting}
                            >
                                <Text style={styles.downloadBtnText}> {exporting ? 'Готовим…' : 'Выгрузить PDF'}</Text>
                            </TouchableOpacity>
                        </View>


                        <View style={styles.section}>
                            {recentVisits.length > 0 ? (
                                recentVisits.map((visit) => (
                                    <View key={visit.id} style={styles.visitCard}>
                                        <View style={styles.visitInfo}>
                                            <Text style={styles.customerName}>{visit.customerName}</Text>
                                            <Text style={styles.serviceName}>{visit.service}</Text>
                                        </View>
                                        <View style={styles.visitDetails}>
                                            <Text style={styles.visitTime}>
                                                {new Date(visit.timestamp).toLocaleTimeString('ru-RU', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Text>
                                            <Text style={styles.visitAmount}>
                                                {visit.type === 'subscription' ? 'ПОДПИСКА' : `${visit.amount}₸`}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>Пока нет визитов</Text>
                                </View>
                            )}
                        </View>


                    </ScrollView>
                )}


                {selectedTab === 'qr' && (
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.qrScrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#14213D"
                            />
                        }
                    >
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>QR-КОД АВТОМОЙКИ</Text>
                            <Text style={styles.qrDescription}>
                                Клиент сканирует код, выбирает допы и оплачивает. Сессия действительна ограниченное
                                время.
                            </Text>
                            <View style={styles.qrContainer}>
                                {qrCreating ? (
                                    <Text style={styles.emptyStateText}>Создаём QR…</Text>
                                ) : qrUrl ? (
                                    <>
                                        <QRCode
                                            value={qrUrl ?? ''}  // "washly://qr/<token>"
                                            size={220}
                                            backgroundColor="#FFFFFF"
                                            foregroundColor="#000000"
                                        />

                                        <View style={{marginTop: 8, alignItems: 'center'}}>
                                            <Text style={{color: '#14213D', fontWeight: '700'}}>
                                                Статус: {qrStatus ?? '—'}
                                            </Text>
                                            <Text style={{color: '#14213D', marginTop: 4}}>
                                                Истекает через: {fmt(expiresIn)}
                                            </Text>
                                        </View>

                                        <View style={{marginTop: 16, gap: 10, width: '100%'}}>
                                            <TouchableOpacity style={styles.primaryBtn} onPress={resetSession}>
                                                <Text style={[styles.primaryBtnText, styles.textWhite]}>Обновить
                                                    QR</Text>
                                            </TouchableOpacity>

                                            {qrStatus === 'cash_waiting_approval' && (
                                                <TouchableOpacity
                                                    style={[styles.secondaryBtn, approving && {opacity: 0.6}]}
                                                    onPress={approveCash} disabled={approving}>
                                                    <Text
                                                        style={styles.secondaryBtnText}>{approving ? 'Подтверждаем…' : 'Подтвердить оплату наличными'}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </>
                                ) : (
                                    <TouchableOpacity style={styles.primaryBtn} onPress={createSession}>
                                        <Text style={[styles.primaryBtnText, styles.textWhite]}>Создать QR-сессию</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                )}


                {selectedTab === 'bookings' && (
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={{paddingBottom: 96 + insets.bottom}}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#14213D"
                            />
                        }
                    >

                        {/* Сегмент-переключатель */}
                        <View style={styles.segmentContainer}>
                            <TouchableOpacity
                                style={[styles.segmentBtn, bookingsSubTab === 'active' && styles.segmentBtnActive]}
                                onPress={() => setBookingsSubTab('active')}
                            >
                                <Text
                                    style={[styles.segmentText, bookingsSubTab === 'active' && styles.segmentTextActive]}>
                                    Активные
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.segmentBtn, bookingsSubTab === 'analytics' && styles.segmentBtnActive]}
                                onPress={() => setBookingsSubTab('analytics')}
                            >
                                <Text
                                    style={[styles.segmentText, bookingsSubTab === 'analytics' && styles.segmentTextActive]}>
                                    Прошлые
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ActiveBookingsList
                            selectedDate={selectedDate}
                            carWashOpenTime={user?.carWashDetails?.open_time?.slice(0, 5) || '08:00'}
                            registerRefetch={(fn) => {
                                activeBookingsRef.current = fn;
                            }} // 👈 получаем refetch
                        />

                    </ScrollView>
                )}

                {selectedTab === 'carwash' && <CarWashAdminScreen/>}
            </View>

            {/* BOTTOM NAVBAR */}
            <View style={[styles.navbar, {paddingBottom: Math.max(insets.bottom, 8)}]}>
                {dashLoading && (
                    <View style={[styles.card, {alignItems: 'center', paddingVertical: 12}]}>
                        <Text style={styles.value}>Обновляем статистику…</Text>
                    </View>
                )}
                <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('dashboard')}>
                    <TrendingUp color={selectedTab === 'dashboard' ? '#14213D' : '#9AA0A6'} size={20}/>
                    <Text style={[styles.navLabel, selectedTab === 'dashboard' && styles.navLabelActive]}>
                        Статистика
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('qr')}>
                    <QrCode color={selectedTab === 'qr' ? '#14213D' : '#9AA0A6'} size={20}/>
                    <Text style={[styles.navLabel, selectedTab === 'qr' && styles.navLabelActive]}>QR-код</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('bookings')}>
                    <BarChart3 color={selectedTab === 'bookings' ? '#14213D' : '#9AA0A6'} size={20}/>
                    <Text style={[styles.navLabel, selectedTab === 'bookings' && styles.navLabelActive]}>Записи</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('carwash')}>
                    <User color={selectedTab === 'carwash' ? '#14213D' : '#9AA0A6'} size={20}/>
                    <Text style={[styles.navLabel, selectedTab === 'carwash' && styles.navLabelActive]}>Автомойка</Text>
                </TouchableOpacity>
            </View>

            {/* Модалки «Безопасность» и «Помощь» */}
            <Modal
                visible={showSecuritySettings}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSecuritySettings(false)}
            >
                <View style={[styles.modalContainer, {paddingTop: insets.top}]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>БЕЗОПАСНОСТЬ</Text>
                        <TouchableOpacity onPress={() => setShowSecuritySettings(false)} style={styles.closeButton}>
                            <X color="#14213D" size={24}/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.settingsSection}>
                            <TouchableOpacity
                                style={styles.settingsItem}
                                onPress={() => {
                                    Alert.alert('Смена пароля', 'Функция будет доступна в следующем обновлении');
                                }}
                            >
                                <Shield color="#14213D" size={20}/>
                                <Text style={styles.settingsItemText}>Сменить пароль</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingsItem}
                                onPress={() => {
                                    Alert.alert('Двухфакторная аутентификация', 'Функция будет доступна в следующем обновлении');
                                }}
                            >
                                <Phone color="#14213D" size={20}/>
                                <Text style={styles.settingsItemText}>Двухфакторная аутентификация</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingsItem}
                                onPress={() => {
                                    Alert.alert('Активные сессии', 'У вас 1 активная сессия на этом устройстве');
                                }}
                            >
                                <Settings color="#14213D" size={20}/>
                                <Text style={styles.settingsItemText}>Активные сессии</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingsItem}
                                onPress={() => {
                                    Alert.alert('Резервное копирование', 'Данные автоматически сохраняются в облаке');
                                }}
                            >
                                <Settings color="#14213D" size={20}/>
                                <Text style={styles.settingsItemText}>Резервное копирование</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            <Modal
                visible={showHelpModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowHelpModal(false)}
            >
                <View style={[styles.modalContainer, {paddingTop: insets.top}]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>ПОМОЩЬ</Text>
                        <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.closeButton}>
                            <X color="#14213D" size={24}/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.helpSection}>
                            <Text style={styles.helpSectionTitle}>РУКОВОДСТВО ДЛЯ ВЛАДЕЛЬЦЕВ</Text>

                            <View style={styles.helpItem}>
                                <Text style={styles.helpQuestion}>Как настроить QR-код?</Text>
                                <Text style={styles.helpAnswer}>
                                    Перейдите на вкладку QR-КОД, распечатайте код и разместите его в каждом боксе.
                                    Клиенты смогут
                                    сканировать его для подтверждения визитов.
                                </Text>
                            </View>

                            <View style={styles.helpItem}>
                                <Text style={styles.helpQuestion}>Как отслеживать загруженность?</Text>
                                <Text style={styles.helpAnswer}>
                                    Используйте вкладку ЗАПИСИ для мониторинга загруженности по часам и управления
                                    записями клиентов.
                                </Text>
                            </View>

                            <View style={styles.helpItem}>
                                <Text style={styles.helpQuestion}>Как работает система оплаты?</Text>
                                <Text style={styles.helpAnswer}>
                                    Клиенты с подпиской могут мыться бесплатно. Обычные клиенты оплачивают через
                                    приложение или наличными.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.contactSection}>
                            <Text style={styles.contactSectionTitle}>ПОДДЕРЖКА БИЗНЕСА</Text>
                            <TouchableOpacity style={styles.contactItem}
                                              onPress={() => Alert.alert('Телефон', '+7 (777) 123-45-67')}>
                                <Phone color="#14213D" size={20}/>
                                <Text style={styles.contactText}>Линия поддержки бизнеса</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.contactItem}
                                onPress={() => Alert.alert('Email', 'business@carwash.kz')}
                            >
                                <Settings color="#14213D" size={20}/>
                                <Text style={styles.contactText}>Техническая поддержка</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

        </View>
    );
}
