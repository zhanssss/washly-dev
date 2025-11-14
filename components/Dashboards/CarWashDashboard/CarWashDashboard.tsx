import React, {useEffect, useRef, useMemo, useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert, RefreshControl
} from 'react-native';
import {usePullToRefresh} from '@/src/hooks/usePullToRefresh';
import {styles} from './CarWashDashboard.styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ActiveBookingsList from '@/components/Dashboards/CarWashDashboard/BookingAnalytics/ActiveBookingList';
import {fetchDashboardStats, type DashboardStatsResponse} from '@/src/services/api/dashboardApi';
import {buildStatsExportUrl, type StatsKind, type ExportFormat} from '@/src/services/api/exportsApi';
import {downloadAndShare} from '@/src/utils/download';
import CarWashAdminScreen from './CarWashAdminScreen/CarWashAdminScreen';

import {
    TrendingUp,
    Users,
    Calendar,
    LogOut,
    QrCode,
    BarChart3,
    User, CoinsIcon,
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
import SecuritySettingsModal from "@/components/Modals/SecuritySettingsModal/SecuritySettingsModal";
import HelpModal from "@/components/Modals/HelpModal/HelpModal";

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


interface BookingsTrackerProps {
    carWashId: string;
    selectedDate: Date;
    selectedFilter: string;
    showFilters: boolean;
    onDateChange: (date: Date) => void;
    onFilterChange: (filter: string) => void;
    onToggleFilters: () => void;
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

type BodyType = { id: string; name: string };
type BaseService = { id: string; name: string };

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
        useState<Parameters<typeof fetchDashboardStats>[1] | undefined>({kind: 'day'});

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
        return {start, end};
    };


    const refreshCarWash = async () => {
        try {
            if (selectedTab === 'dashboard') {
                if (statsKind === 'custom') {
                    const {start, end} = getCustomRange();
                    await loadDashboardStats({kind: 'custom', start, end});
                } else if (statsKind === 'year') {
                    await loadDashboardStats({kind: 'year', year: currentYear});
                } else {
                    await loadDashboardStats({kind: statsKind}); // day|week|month
                }
            } else if (selectedTab === 'bookings') {
                await loadDashBookings();
            } else if (selectedTab === 'qr') {
                await generateQrSession();
            }
        } catch {
        }
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
                const {start, end} = getCustomRange();
                url = buildStatsExportUrl({kind: 'custom', start, end, format});
                filename = `stats_${start}_${end}.${format}`;
            } else if (statsKind === 'year') {
                url = buildStatsExportUrl({kind: 'year', year: currentYear, format});
                filename = `stats_${currentYear}.${format}`;
            } else {
                url = buildStatsExportUrl({kind: statsKind, format});
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
                                loadDashboardStats({kind: 'custom', start: isoKZ(from), end: isoKZ(to)});
                            }}


                        />
                        <View style={[styles.segmentContainer, {marginTop: 8}]}>
                            {(['day', 'week', 'month', 'year'] as const).map(k => (
                                <TouchableOpacity
                                    key={k}
                                    style={[styles.segmentBtn, statsKind === k && styles.segmentBtnActive]}
                                    onPress={() => {
                                        setStatsKind(k);
                                        if (k === 'day') loadDashboardStats({kind: 'day'});
                                        if (k === 'week') loadDashboardStats({kind: 'week'});
                                        if (k === 'month') loadDashboardStats({kind: 'month'});
                                        if (k === 'year') loadDashboardStats({kind: 'year', year: currentYear});
                                        // custom — только через выбор в календаре
                                    }}
                                >
                                    <Text style={[styles.segmentText, statsKind === k && styles.segmentTextActive]}>
                                        {k === 'day' ? 'День' : k === 'week' ? 'Неделя' : k === 'month' ? 'Месяц' : 'Год'}
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
                        <View style={{flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12}}>
                            <TouchableOpacity
                                style={[styles.primaryBtn, {flex: 1}, exporting && {opacity: 0.6}]}
                                onPress={() => handleExport('xlsx')}
                                disabled={exporting}
                            >
                                <Text style={[styles.downloadBtnText, styles.textWhite]}>
                                    {exporting ? 'Готовим…' : 'Выгрузить Excel'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryBtn, {flex: 1}, exporting && {opacity: 0.6}]}
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
            <SecuritySettingsModal
                visible={showSecuritySettings}
                onClose={() => setShowSecuritySettings(false)}
            />
            <HelpModal
                visible={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
        </View>
    );
}
