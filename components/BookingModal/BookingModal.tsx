// components/BookingModal.tsx
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Modal,
    Alert,
} from 'react-native';
import {Star, MapPin, Clock, Calendar} from 'lucide-react-native';
import { cancelDriverBooking } from '@/src/services/api/bookingsApi';

import {styles} from '@/components/Dashboards/CarOwnerDashboard/CarOwnerDashboard.styles';
import {colors} from '@/assets/Theme/colors';

import type {BookingSlot} from '@/src/data/carWashes';
import type {
    CarWashDetail,
    Box,
    BoxSlotsResponse,
    CreateBookingPayload
} from '@/src/services/api/carWashesApi';
import {
    createBooking,
    ActiveBookingExistsError,
} from '@/src/services/api/carWashesApi';


import {useAuthStore} from '@/src/stores/authStore';

const KZ_TZ = 'Asia/Almaty';
const toHHMM = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: KZ_TZ,
    });

const dateKZ = (ymd: string) =>
    new Date(ymd).toLocaleDateString('ru-RU', {day: '2-digit', month: 'long', year: 'numeric', timeZone: KZ_TZ});
const timeKZ = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit', timeZone: KZ_TZ});

// 1) Вверху файла (рядом с типами)

type ActiveConflict = {
    booking_id: string;
    box_id: string;
    date: string;
    start_time: string;
    end_time: string;
};


// 2) Стейт


type MinimalWash = {
    id: string | number;
    image: string;
    name: string;
    rating: number;
    address: string;
    workingHours?: string;
};

type Props = {
    visible: boolean;
    insetsTop: number;
    selectedWash: MinimalWash | null;

    // данные по автомойке/боксам/слотам
    washDetail: CarWashDetail | null;
    boxes: Box[];
    selectedBoxId: number | null;
    setSelectedBoxId: (id: number) => void;
    loadingSlots: boolean;
    boxSlots: BoxSlotsResponse | null;
    bookingDate: string;
    onReloadSlots: (washId: number, boxId: number, date: string) => Promise<void>;

    // выбор слота/услуг
    selectedSlot: BookingSlot | null;
    setSelectedSlot: (slot: BookingSlot | null) => void;
    selectedBodyId: number | null;
    setSelectedBodyId: (id: number) => void;
    selectedExtras: number[];
    toggleExtra: (id: number) => void;

    // цены и подсчёты
    getBasePrice: () => number;
    getExtrasTotal: () => number;
    calculateTotalPrice: () => number;

    // действия
    onClose: () => void;
};

export default function BookingModal({
                                         visible,
                                         insetsTop,
                                         selectedWash,
                                         washDetail,
                                         boxes,
                                         selectedBoxId,
                                         setSelectedBoxId,
                                         loadingSlots,
                                         boxSlots,
                                         bookingDate,
                                         onReloadSlots,

                                         selectedSlot,
                                         setSelectedSlot,
                                         selectedBodyId,
                                         setSelectedBodyId,
                                         selectedExtras,
                                         toggleExtra,

                                         getBasePrice,
                                         getExtrasTotal,
                                         calculateTotalPrice,

                                         onClose,
                                     }: Props) {
    const user = useAuthStore((s) => s.user);
    const [submitting, setSubmitting] = React.useState(false);
    const [conflict, setConflict] = React.useState<ActiveConflict | null>(null);
    const [replaceVisible, setReplaceVisible] = React.useState(false);
    const [replacing, setReplacing] = React.useState(false);
    const lastPayloadRef = React.useRef<CreateBookingPayload | null>(null);

    const submitBooking = async () => {
        if (!selectedWash || !selectedBoxId || !selectedSlot || selectedBodyId == null) return;

        const slot_index = Number((selectedSlot as any)?.slot_index ?? (selectedSlot as any)?.id);
        const client = Number(user?.id);
        const car_body = Number(selectedBodyId);
        const total_price = Number(calculateTotalPrice?.() ?? 0);
        const extra_services = Array.isArray(selectedExtras) ? selectedExtras : [];

        if (!Number.isFinite(slot_index)) return Alert.alert('Ошибка', 'Не удалось определить slot_index.');
        if (!Number.isFinite(client)) return Alert.alert('Ошибка', `Не удалось определить пользователя ${client}. Войдите в аккаунт.`);
        if (!Number.isFinite(car_body)) return Alert.alert('Ошибка', 'Не выбран тип кузова.');

        const payload: CreateBookingPayload = {
            car_wash: Number(selectedWash.id),
            box: Number(selectedBoxId),
            slot_index,
            client,
            car_body,
            extra_services,
            total_price,
        };

        try {
            setSubmitting(true);
            lastPayloadRef.current = payload;
            await createBooking(payload);

            Alert.alert('Запись создана', `Мойка: ${selectedWash.name}\nСумма: ${total_price.toLocaleString()} ₸`);
            await onReloadSlots(Number(selectedWash.id), selectedBoxId, bookingDate);
            setSelectedSlot(null);
            onClose();
        } catch (e: any) {
            // ловим конфликт активной брони
            if (e instanceof ActiveBookingExistsError || e?.code === 'ACTIVE_BOOKING_EXISTS') {
                const raw = (e as any)?.details ?? (e as any)?.active_booking; // может быть undefined/null
                if (raw) {
                    setConflict({
                        booking_id: String(raw.booking_id ?? ''),
                        box_id: String(raw.box_id ?? ''),
                        date: String(raw.date ?? ''),
                        start_time: String(raw.start_time ?? ''),
                        end_time: String(raw.end_time ?? ''),
                    });
                } else {
                    setConflict({
                        booking_id: '',
                        box_id: '',
                        date: '',
                        start_time: '',
                        end_time: '',
                    });
                }
                setReplaceVisible(true);
            } else {
                Alert.alert('Ошибка', e?.message ?? 'Не удалось создать бронь');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const confirmReplace = async () => {
        if (!lastPayloadRef.current) return;
        const oldId = conflict?.booking_id;
        try {
            setReplacing(true);

            // 1) сперва отменяем старую бронь
            if (oldId) {
                await cancelDriverBooking(oldId);
            }

            // 2) потом создаём новую
            const payload = { ...lastPayloadRef.current };
            delete (payload as any).replace_existing; // на всякий случай

            await createBooking(payload);
            setReplaceVisible(false);
            setConflict(null);
            Alert.alert('Готово', 'Время перенесено');

            if (selectedWash && selectedBoxId) {
                await onReloadSlots(Number(selectedWash.id), selectedBoxId, bookingDate);
            }
            setSelectedSlot(null);
            onClose();
        } catch (e: any) {
            Alert.alert('Ошибка', e?.message ?? 'Не удалось перенести запись');
        } finally {
            setReplacing(false);
        }
    };



    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.bookingModal, {paddingTop: insetsTop}]}>
                {/* header */}
                <View style={styles.bookingHeader}>
                    <Text style={styles.bookingTitle}>ЗАПИСАТЬСЯ НА МОЙКУ</Text>
                    <TouchableOpacity onPress={onClose} style={styles.bookingCloseButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {selectedWash && (
                    <ScrollView style={styles.bookingContent} showsVerticalScrollIndicator={false}>
                        {/* шапка автомойки */}
                        <View style={styles.bookingCarWashInfo}>
                            <Image source={{uri: selectedWash.image}} style={styles.bookingCarWashImage}/>
                            <View style={styles.bookingCarWashDetails}>
                                <Text style={styles.bookingCarWashName}>{selectedWash.name}</Text>

                                <View style={styles.bookingCarWashMeta}>
                                    <View style={styles.bookingRating}>
                                        <Star color="#FFD700" size={14} fill="#FFD700"/>
                                        <Text style={styles.bookingRatingText}>{selectedWash.rating}</Text>
                                    </View>

                                    <View style={styles.bookingLocation}>
                                        <MapPin color="#888888" size={12}/>
                                        <Text style={styles.bookingLocationText}>{selectedWash.address}</Text>
                                    </View>
                                </View>

                                {!!selectedWash.workingHours && (
                                    <View style={styles.bookingWorkingHours}>
                                        <Clock color="#FF6B35" size={14}/>
                                        <Text
                                            style={styles.bookingWorkingHoursText}>{selectedWash.workingHours}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Слоты */}
                        <View style={styles.slotsSection}>
                            <Text style={styles.slotsSectionTitle}>ДОСТУПНЫЕ СЛОТЫ</Text>
                            <Text style={styles.slotsSectionSubtitle}>
                                {washDetail
                                    ? `Слот: ${washDetail.slotMinutes} мин • Буфер: ${washDetail.bufferMinutes} мин`
                                    : ''}
                            </Text>
                            {boxes.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                            style={{marginVertical: 8}}>
                                    {boxes.map((b) => (
                                        <TouchableOpacity
                                            key={b.id}
                                            style={[
                                                styles.serviceItem,
                                                selectedBoxId === b.id && styles.serviceItemSelected,
                                            ]}
                                            onPress={async () => {
                                                setSelectedBoxId(b.id);
                                                await onReloadSlots(Number(selectedWash.id), b.id, bookingDate);
                                            }}
                                        >
                                            <Text style={styles.serviceText}>{b.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {/* сетка слотов */}
                            {loadingSlots ? (
                                <ActivityIndicator/>
                            ) : !boxSlots || boxSlots.items.length === 0 ? (
                                <Text style={{color: colors.mutedText, marginTop: 8}}>
                                    Нет слотов на выбранную дату
                                </Text>
                            ) : (
                                <View style={styles.slotsGrid}>
                                    {boxSlots.items.map((r) => {
                                        const nowMs = Date.now();
                                        const startMs = new Date(r.starts_at).getTime();
                                        const endMs = new Date(r.ends_at).getTime();
                                        const hasStarted = nowMs >= startMs;  // слот уже начался
                                        const isPast = nowMs >= endMs;        // слот уже закончился
                                        const available = r.status === 'free' && !hasStarted;
                                        return (
                                            <TouchableOpacity
                                                key={r.slot_index}
                                                style={[
                                                    styles.slotCard,
                                                    !available && styles.slotCardDisabled,
                                                    selectedSlot?.id === String(r.slot_index) && styles.slotCardSelected,

                                                ]}
                                                onPress={() =>
                                                    available &&
                                                    setSelectedSlot({
                                                        id: String(r.slot_index),
                                                        time: toHHMM(r.starts_at), // только HH:mm в Asia/Almaty
                                                        price: 0,
                                                        available: true,
                                                        starts_at: r.starts_at,
                                                        ends_at: r.ends_at,
                                                        slot_index: r.slot_index,
                                                    } as any)

                                                }
                                                disabled={!available}
                                            >
                                                <Text
                                                    style={[
                                                        styles.slotTime,
                                                        !available && styles.slotTimeDisabled,
                                                        selectedSlot?.id === String(r.slot_index) && styles.slotTimeSelected,
                                                    ]}
                                                >
                                                    {toHHMM(r.starts_at)}
                                                </Text>

                                                {!available && (
                                                    <View
                                                        style={[
                                                            styles.slotUnavailableBadge,
                                                            isPast
                                                                ? { backgroundColor: '#cccccc' }      // прошло
                                                                : r.status === 'booked'
                                                                    ? { backgroundColor: '#ff6b6b' }    // занято
                                                                    : { backgroundColor: '#ffd166' }    // идет / hold
                                                        ]}
                                                    >
                                                        <Text style={styles.slotUnavailableText}>
                                                            {isPast ? 'ПРОШЛО' : r.status === 'booked' ? 'ЗАНЯТО' : hasStarted ? 'ИДЕТ' : 'HOLD'}
                                                        </Text>
                                                    </View>
                                                )}

                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        {/* Услуги */}
                        <View style={styles.servicesSection}>
                            <Text style={styles.servicesSectionTitle}>УСЛУГИ</Text>
                            <Text style={styles.servicesSectionSubtitle}>
                                Основная услуга рассчитывается по типу кузова.
                            </Text>

                            {/* Базовая услуга по кузову */}
                            <View style={styles.serviceCategorySection}>
                                <Text style={styles.serviceCategoryTitle}>МОЙКА КУЗОВА</Text>

                                {!washDetail ? (
                                    <Text style={{color: colors.mutedText}}>Загрузка…</Text>
                                ) : washDetail.bodyPrices.length === 0 ? (
                                    <Text style={{color: colors.mutedText}}>Нет цен по кузовам</Text>
                                ) : (
                                    <View style={{gap: 8}}>
                                        {washDetail.bodyPrices.map((bp) => {
                                            const selected = bp.bodyId === selectedBodyId;
                                            return (
                                                <TouchableOpacity
                                                    key={bp.bodyId}
                                                    style={[styles.serviceItem, selected && styles.serviceItemSelected]}
                                                    onPress={() => setSelectedBodyId(bp.bodyId)}
                                                >
                                                    <View style={styles.serviceMainInfo}>
                                                        <View style={styles.serviceHeader}>
                                                            <Text style={styles.serviceIcon}>🚗</Text>
                                                            <View style={styles.serviceInfo}>
                                                                <Text
                                                                    style={[styles.serviceText, selected && styles.serviceTextSelected]}
                                                                >
                                                                    {bp.bodyName}
                                                                </Text>
                                                                <Text style={styles.serviceDescription}>
                                                                    Базовая мойка кузова для данного типа
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.servicePriceContainer}>
                                                            <Text
                                                                style={[styles.servicePrice, selected && styles.servicePriceSelected]}
                                                            >
                                                                {bp.price.toLocaleString()} ₸
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View
                                                        style={[styles.serviceCheckbox, selected && styles.serviceCheckboxSelected]}
                                                    >
                                                        {selected && <View style={styles.serviceCheckboxInner}/>}
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>

                            {/* Дополнительные услуги */}
                            <View style={styles.serviceCategorySection}>
                                <Text style={styles.serviceCategoryTitle}>ДОПОЛНИТЕЛЬНО</Text>

                                {!washDetail ? (
                                    <Text style={{color: colors.mutedText}}>Загрузка…</Text>
                                ) : washDetail.extraServices.length === 0 ? (
                                    <Text style={{color: colors.mutedText}}>Нет дополнительных услуг</Text>
                                ) : (
                                    <View style={styles.servicesList}>
                                        {washDetail.extraServices.map((es) => {
                                            const selected = selectedExtras.includes(es.id);
                                            return (
                                                <TouchableOpacity
                                                    key={es.id}
                                                    style={[styles.serviceItem, selected && styles.serviceItemSelected]}
                                                    onPress={() => toggleExtra(es.id)}
                                                >
                                                    <View style={styles.serviceMainInfo}>
                                                        <View style={styles.serviceHeader}>
                                                            <Text style={styles.serviceIcon}>➕</Text>
                                                            <View style={styles.serviceInfo}>
                                                                <Text
                                                                    style={[styles.serviceText, selected && styles.serviceTextSelected]}
                                                                >
                                                                    {es.name}
                                                                </Text>
                                                                <Text style={styles.serviceDescription}>Дополнительная
                                                                    услуга</Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.servicePriceContainer}>
                                                            <Text
                                                                style={[styles.servicePrice, selected && styles.servicePriceSelected]}
                                                            >
                                                                {es.price.toLocaleString()} ₸
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View
                                                        style={[styles.serviceCheckbox, selected && styles.serviceCheckboxSelected]}
                                                    >
                                                        {selected && <View style={styles.serviceCheckboxInner}/>}
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>

                            {/* Итого */}
                            <View style={styles.totalPriceSection}>
                                <View style={styles.totalPriceContainer}>
                                    <Text style={styles.totalPriceLabel}>ИТОГО:</Text>
                                    <Text style={styles.totalPriceValue}>
                                        {calculateTotalPrice().toLocaleString()} ₸
                                    </Text>
                                </View>
                                <Text style={styles.totalPriceSubtext}>
                                    База: {getBasePrice().toLocaleString()} ₸
                                    {selectedExtras.length > 0
                                        ? ` • Допы: ${getExtrasTotal().toLocaleString()} ₸`
                                        : ''}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                )}
                <View style={styles.bookingActions}>
                    <TouchableOpacity
                        style={[
                            styles.confirmBookingButton,
                            ((!selectedSlot || selectedBodyId == null) || submitting) && styles.confirmBookingButtonDisabled,
                        ]}
                        onPress={submitBooking}
                        disabled={!selectedSlot || selectedBodyId == null || submitting}
                    >
                        <Calendar
                            color={selectedSlot && selectedBodyId != null && !submitting ? '#000000' : '#666666'}
                            size={20}/>
                        <Text
                            style={[
                                styles.confirmBookingButtonText,
                                ((!selectedSlot || selectedBodyId == null) || submitting) && styles.confirmBookingButtonTextDisabled,
                            ]}
                        >
                            {submitting ? 'СОЗДАЕМ…' : `ПОДТВЕРДИТЬ ЗАПИСЬ • ${calculateTotalPrice().toLocaleString()} ₸`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Modal
                visible={replaceVisible}
                animationType="fade"
                transparent
                onRequestClose={() => {
                    setReplaceVisible(false);
                    setConflict(null);
                }}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16
                }}>
                    <View style={{
                        width: '100%',
                        maxWidth: 420,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 16
                    }}>
                        <Text style={{fontSize: 16, fontWeight: '600', marginBottom: 8}}>
                            У вас уже есть активная бронь
                        </Text>
                        {conflict && (
                            <>
                                <Text style={{marginBottom: 4}}>Дата: {dateKZ(conflict.date)}</Text>
                                <Text style={{marginBottom: 4}}>
                                    Время: {timeKZ(conflict.start_time)}–{timeKZ(conflict.end_time)}
                                </Text>
                            </>
                        )}
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 12}}>
                            <TouchableOpacity
                                onPress={() => {
                                    setReplaceVisible(false);
                                    setConflict(null);
                                }}
                                style={{paddingVertical: 10, paddingHorizontal: 14}}
                            >
                                <Text style={{color: '#14213D'}}>Отмена</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={confirmReplace}
                                disabled={replacing}
                                style={{
                                    backgroundColor: '#14213D',
                                    paddingVertical: 10, paddingHorizontal: 14,
                                    borderRadius: 8, opacity: replacing ? 0.7 : 1
                                }}
                            >
                                {replacing ? (
                                    <ActivityIndicator/>
                                ) : (
                                    <Text style={{color: '#fff', fontWeight: '600'}}>Заменить бронь</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
}
