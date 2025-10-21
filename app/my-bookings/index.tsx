//my-bookings/index.ts
import React from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert, Linking} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MapPin, Clock, X, ArrowLeft, Phone} from 'lucide-react-native';
import {router} from 'expo-router';
import {colors} from '@/assets/Theme/colors';
import {useMyBookings} from '@/src/data/bookings/useMyBookings';
import type {MyBooking} from '@/src/types/bookings';
import {styles} from './my-bookings.styles'

// ...импорты те же
export default function MyBookingsScreen() {
    const insets = useSafeAreaInsets();
    const {myBookings, cancelBooking} = useMyBookings();

    const toTel = (raw?: string | null) => {
        const s = (raw ?? '').trim();
        if (!s) return null;
        const digits = s.replace(/\D/g, '');
        if (!digits) return null;
        if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
        if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
        if (s.startsWith('+')) return s;
        return `+${digits}`;
    };

    const handleCall = (b: MyBooking) => {
        const tel = toTel(b.phoneNumber);
        if (!tel) { Alert.alert('Телефон', 'Номер недоступен'); return; }
        Linking.openURL(`tel:${tel}`).catch(() =>
            Alert.alert('Телефон', `Не удалось открыть звонилку для ${tel}`)
        );
    };


    const handleOpenBookingMap = (b: MyBooking) => {
        router.push('/map');
    };
    const handleShowBookingQR = (_b: MyBooking) => {
        Alert.alert('QR', 'Здесь будет открываться QR-экран конкретной записи');
    };

    const booked = myBookings.filter(b => b.status === 'booked');
    const history = myBookings.filter(b => b.status !== 'booked');

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft color={colors.accent} size={18}/>
                </TouchableOpacity>
                <Text style={styles.title}>Мои записи</Text>
                <View style={{width: 36}}/>
            </View>

            {/* List */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{paddingBottom: Math.max(insets.bottom, 16) + 12}}
                showsVerticalScrollIndicator={false}
            >
                {myBookings.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>Пока нет записей</Text>
                        <Text style={styles.emptySubtitle}>Записывайтесь из каталога автомоек</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {/* Активные (booked) */}
                        {booked.map((b) => (
                            <View key={`booked-${b.id}`} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={styles.timeBlock}>
                                        <Clock size={16} color={colors.accent}/>
                                        <Text style={styles.timeText}>{b.startTime}–{b.endTime}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, styles.statusConfirmed /* зелёный */]}>
                                        <Text style={styles.statusText}>Забронирована</Text>
                                    </View>
                                    <Text style={styles.price}>{b.price.toLocaleString()} ₸</Text>
                                </View>

                                <Text style={styles.washName}>{b.carWashName}</Text>
                                <View style={styles.metaRow}>
                                    <MapPin size={14} color={colors.mutedText}/>
                                    <Text style={styles.address}>{b.address}</Text>
                                </View>

                                <View style={styles.chipsRow}>
                                    {b.boxName ? <Text style={styles.chip}>{b.boxName}</Text> : null}
                                    {b.services.map((s) => (
                                        <Text key={s} style={styles.chip}>{s}</Text>
                                    ))}
                                </View>

                                <View style={styles.footerRow}>

                                    <View style={styles.actions}>
                                        <TouchableOpacity style={[styles.actionBtn, styles.callBtn]}
                                                          onPress={() => handleCall(b)}
                                                          accessibilityLabel="Позвонить в автомойку">
                                            <Phone size={16} color={colors.textDark}/>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionBtn}
                                                          onPress={() => handleOpenBookingMap(b)}>
                                            <MapPin size={16} color={colors.textDark}/>
                                            <Text style={styles.actionText}>На карте</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.cancelBtn]}
                                            onPress={() => cancelBooking(b.id)}
                                        >
                                            <X size={16} color={colors.textDark}/>
                                            <Text style={styles.actionText}>Отменить</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Разделительная линия (только если есть и booked, и history) */}
                        {booked.length > 0 && history.length > 0 ? (
                            <View style={styles.sectionDivider}/>
                        ) : null}

                        {/* История (past + canceled) */}
                        {history.map((b) => (
                            <View key={`history-${b.id}`} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={styles.timeBlock}>
                                        <Clock size={16} color={colors.accent}/>
                                        <Text style={styles.timeText}>{b.startTime}–{b.endTime}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        b.status === 'canceled' ? styles.statusCanceled : styles.statusWaiting /* серый */
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {b.status === 'canceled' ? 'Отменена' : 'Прошла'}
                                        </Text>
                                    </View>
                                    <Text style={styles.price}>{b.price.toLocaleString()} ₸</Text>
                                </View>

                                <Text style={styles.washName}>{b.carWashName}</Text>
                                <View style={styles.metaRow}>
                                    <MapPin size={14} color={colors.mutedText}/>
                                    <Text style={styles.address}>{b.address}</Text>
                                </View>

                                <View style={styles.chipsRow}>
                                    {b.boxName ? <Text style={styles.chip}>{b.boxName}</Text> : null}
                                    {b.services.map((s) => (
                                        <Text key={s} style={styles.chip}>{s}</Text>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

