// components/carWashDashboard/BookingAnalytics/BookingsAnalytics.tsx
import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Modal} from 'react-native';
import {Calendar as CalendarIcon, Filter, ChevronDown, Activity, Clock} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {styles} from '../CarWashDashboard.styles';
import {useAuth} from '@/contexts/AuthContext';
import {useVisits, type HourlyData} from '@/contexts/VisitsContext';
import {carWashesAlmaty} from '@/src/data/carWashes';

import {Calendar as RNCalendar, LocaleConfig, type DateData} from 'react-native-calendars';

// ru locale
LocaleConfig.locales.ru = {
    monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    today: 'Сегодня',
};
LocaleConfig.defaultLocale = 'ru';

type Props = {
    carWashId: string;
    selectedDate: Date;
    selectedFilter: string;
    showFilters: boolean;
    onDateChange: (d: Date) => void;
    onFilterChange: (k: string) => void;
    onToggleFilters: () => void;
    selectedFromDate?: Date | null;
    selectedToDate?: Date | null;
    onRangeChange?: (from: Date, to: Date) => void;
};

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const normUTC = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
};
const daysISO = (a: Date, b: Date) => {
    const res: string[] = [];
    let cur = normUTC(a), end = normUTC(b);
    while (cur <= end) {
        res.push(toISO(cur));
        cur = addDays(cur, 1);
    }
    return res;
};

export default function BookingsAnalytics({
                                              carWashId,
                                              selectedDate,
                                              selectedFilter,
                                              showFilters,
                                              onDateChange,
                                              onFilterChange,
                                              onToggleFilters,

                                              selectedFromDate,
                                              selectedToDate,
                                              onRangeChange,
                                          }: Props) {
    const {getHourlyBookings, getBookingsByDate} = useVisits();
    const {user} = useAuth();
    const insets = useSafeAreaInsets();

    const [isCalendarOpen, setCalendarOpen] = useState(false);
    const [isRangeOpen, setRangeOpen] = useState(false);

    // локальный выбор периода
    const [rangeStart, setRangeStart] = useState<Date | null>(selectedFromDate ?? null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(selectedToDate ?? null);

    const hourlyData = useMemo(() => {
        return getHourlyBookings(carWashId, selectedDate);
    }, [carWashId, selectedDate, getHourlyBookings]);

    const bookingsToday = useMemo(() => {
        return getBookingsByDate(carWashId, selectedDate, 'today');
    }, [carWashId, selectedDate, getBookingsByDate]);

    const filterOptions = [
        {key: 'today', label: 'Сегодня'},
        {key: 'week', label: 'Эта неделя'},
        {key: 'month', label: 'Этот месяц'},
        {key: 'all', label: 'Все время'},
    ];

    const getWorkingHours = () => {
        const cw = carWashesAlmaty.find((x) => x.id === carWashId);
        const workingHours = cw?.workingHoursDetailed || user?.carWashDetails?.workingHours;

        if (!workingHours || workingHours.is24Hours) {
            return Array.from({length: 24}, (_, i) => i);
        }
        const startHour = parseInt(workingHours.start.split(':')[0], 10);
        const endHour = parseInt(workingHours.end.split(':')[0], 10);
        const hours: number[] = [];

        if (endHour === 24) {
            for (let h = startHour; h < 24; h++) hours.push(h);
        } else if (startHour <= endHour) {
            for (let h = startHour; h < endHour; h++) hours.push(h);
        } else {
            for (let h = startHour; h < 24; h++) hours.push(h);
            for (let h = 0; h < endHour; h++) hours.push(h);
        }
        return hours;
    };

    const workingHoursArray = getWorkingHours();

    const getLoadPercentage = (hour: number) => {
        const hourData = hourlyData.find((h: HourlyData) => h.hour === hour);
        const maxCapacity = 4;
        return hourData ? Math.min((hourData.bookings / maxCapacity) * 100, 100) : 0;
    };

    const getLoadColor = (p: number) => {
        if (p >= 80) return '#FF4444';
        if (p >= 60) return '#14213D';
        if (p >= 40) return '#FFA500';
        return '#4CAF50';
    };

    const getStatusText = (p: number) => {
        if (p >= 80) return 'ПЕРЕГРУЖЕНО';
        if (p >= 60) return 'ВЫСОКАЯ';
        if (p >= 40) return 'СРЕДНЯЯ';
        return 'НИЗКАЯ';
    };

    const selectedISO = toISO(selectedDate);

    // ------- Range Calendar helpers -------
    const rangeStartISO = rangeStart ? toISO(rangeStart) : undefined;
    const rangeEndISO = rangeEnd ? toISO(rangeEnd) : undefined;

    const markedRange = (() => {
        if (!rangeStart) return {};
        const start = normUTC(rangeStart);
        const end = normUTC(rangeEnd ?? rangeStart);
        const days = daysISO(start, end);

        const obj: Record<string, any> = {};
        days.forEach((iso, idx) => {
            const startingDay = idx === 0;
            const endingDay = idx === days.length - 1;
            obj[iso] = {
                startingDay,
                endingDay,
                color: startingDay || endingDay ? '#14213D' : '#E5EAF3',
                textColor: startingDay || endingDay ? '#fff' : '#14213D',
            };
        });
        return obj;
    })();

    const onPickRangeDay = (day: DateData) => {
        const picked = new Date(day.dateString);
        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(picked);
            setRangeEnd(null);
            return;
        }
        // only start is set
        if (picked < rangeStart) {
            setRangeStart(picked);
            setRangeEnd(null);
        } else {
            setRangeEnd(picked);
        }
    };

    const applyRange = () => {
        const start = rangeStart ?? normUTC(new Date());
        const end = rangeEnd ?? rangeStart ?? start;
        if (onRangeChange) onRangeChange(normUTC(start), normUTC(end));
        // на случай, если родитель не использует период — оставим совместимость
        if (!onRangeChange) onDateChange(normUTC(start));
        setRangeOpen(false);
    };

    const quickSetLastNDays = (n: number) => {
        const today = normUTC(new Date());
        setRangeEnd(today);
        setRangeStart(addDays(today, -n + 1));
    };

    const rangeLabel = useMemo(() => {
        if (rangeStart && rangeEnd) {
            return `${rangeStart.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })} — ${rangeEnd.toLocaleDateString('ru-RU', {day: '2-digit', month: 'short', year: 'numeric'})}`;
        }
        return selectedDate.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});
    }, [rangeStart, rangeEnd, selectedDate]);

    const onPick = (day: DateData) => {
        const picked = new Date(day.dateString);
        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(picked);
            setRangeEnd(null);
            return;
        }
        if (picked < rangeStart) {
            setRangeStart(picked);
            setRangeEnd(null);
        } else {
            setRangeEnd(picked);
        }
    };

    const marked = useMemo(() => {
        if (!rangeStart) return {};
        const start = normUTC(rangeStart);
        const end = normUTC(rangeEnd ?? rangeStart);
        const arr = daysISO(start, end);
        const m: Record<string, any> = {};
        arr.forEach((iso, i) => {
            m[iso] = {
                startingDay: i === 0,
                endingDay: i === arr.length - 1,
                color: (i === 0 || i === arr.length - 1) ? '#14213D' : '#E5EAF3',
                textColor: (i === 0 || i === arr.length - 1) ? '#fff' : '#14213D',
            };
        });
        return m;
    }, [rangeStart, rangeEnd]);

    const apply = () => {
        if (rangeStart && rangeEnd) {
            onRangeChange?.(normUTC(rangeStart), normUTC(rangeEnd));
        } else if (rangeStart) {
            const d = normUTC(rangeStart);
            onRangeChange?.(d, d);
        }
        setCalendarOpen(false);
    };

    const totalInRange = useMemo(() => {
        if (!rangeStart) {
            // нет диапазона — считаем выбранный день (обратная совместимость)
            return getBookingsByDate(carWashId, selectedDate, 'today').length;
        }
        const start = normUTC(rangeStart);
        const end = normUTC(rangeEnd ?? rangeStart);

        let total = 0;
        for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
            total += getBookingsByDate(carWashId, d, 'today').length;
        }
        return total;
    }, [rangeStart, rangeEnd, carWashId, selectedDate, getBookingsByDate]);


    const setToday = () => {
        const t = normUTC(new Date());
        setRangeStart(t);
        setRangeEnd(null);
    };

    const quick7 = () => {
        const t = normUTC(new Date());
        setRangeStart(addDays(t, -6));
        setRangeEnd(t);
    };

    useEffect(() => {
        setRangeStart(selectedFromDate ?? null);
        setRangeEnd(selectedToDate ?? null);
    }, [selectedFromDate, selectedToDate]);

    return (
        <>
            <ScrollView
                style={styles.contentBookingAnalytics}
                contentContainerStyle={{paddingBottom: 2 + insets.bottom}}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <View style={styles.filtersContainer}>
                        <Text style={styles.filterLabel}>ДАТА / ПЕРИОД:</Text>
                        <TouchableOpacity style={styles.dateSelector} onPress={() => setCalendarOpen(true)}>
                            <CalendarIcon color="#fff" size={20}/>
                            <Text style={styles.dateSelectorText}>{rangeLabel}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subsectionTitle}>ЗАГРУЖЕННОСТЬ ПО ЧАСАМ</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyChart}>
                        <View style={styles.hourlyContainer}>
                            {workingHoursArray.map((hour) => {
                                const percentage = getLoadPercentage(hour);
                                const color = getLoadColor(percentage);
                                return (
                                    <View key={hour} style={styles.hourColumn}>
                                        <View style={styles.hourBar}>
                                            <View
                                                style={[
                                                    styles.hourBarFill,
                                                    {height: `${percentage}%`, backgroundColor: color},
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.hourLabel}>{hour.toString().padStart(2, '0')}:00</Text>
                                        <Text style={styles.hourPercentage}>{Math.round(percentage)}%</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Плитки */}
                    <Text style={styles.subsectionTitle}>СТАТУС ЗАГРУЖЕННОСТИ</Text>
                    <View style={styles.statusGrid}>
                        {workingHoursArray
                            .filter((_, index) => index % 2 === 0)
                            .map((hour) => {
                                const nextHourIndex = workingHoursArray.indexOf(hour) + 1;
                                const endHour =
                                    nextHourIndex < workingHoursArray.length ? workingHoursArray[nextHourIndex] : hour + 1;
                                const p1 = getLoadPercentage(hour);
                                const p2 = getLoadPercentage(endHour);
                                const avg = (p1 + p2) / 2;
                                const color = getLoadColor(avg);
                                const status = getStatusText(avg);

                                return (
                                    <View key={hour} style={styles.statusCard}>
                                        <View style={styles.statusHeader}>
                                            <Text style={styles.statusTime}>
                                                {hour.toString().padStart(2, '0')}:00-{endHour.toString().padStart(2, '0')}:00
                                            </Text>
                                            <View style={[styles.statusIndicator, {backgroundColor: color}]}/>
                                        </View>
                                        <Text style={[styles.statusText, {color}]}>{status}</Text>
                                        <Text style={styles.statusBookings}>
                                            {(hourlyData.find((h: HourlyData) => h.hour === hour)?.bookings || 0) +
                                                (hourlyData.find((h: HourlyData) => h.hour === endHour)?.bookings || 0)}{' '}
                                            записей
                                        </Text>
                                    </View>
                                );
                            })}
                    </View>
                </View>
            </ScrollView>

            <Modal visible={isCalendarOpen} transparent animationType="fade"
                   onRequestClose={() => setCalendarOpen(false)}>
                <View style={styles.backdrop}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Выберите дату или диапазон</Text>
                        <RNCalendar
                            markingType="period"
                            initialDate={toISO(rangeStart ?? selectedDate)}
                            current={toISO(rangeStart ?? selectedDate)}
                            onDayPress={onPick}
                            markedDates={marked}
                            enableSwipeMonths
                            theme={{
                                selectedDayBackgroundColor: '#14213D',
                                arrowColor: '#14213D',
                                todayTextColor: '#14213D',
                                textSectionTitleColor: '#9aa0a6',
                            }}
                        />
                        <ScrollView
                            horizontal
                            style={[styles.actionsScroll, { flex: 0 }]}
                            contentContainerStyle={styles.actionsContent}
                            showsHorizontalScrollIndicator={false}
                        >
                            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={apply}>
                                <Text style={[styles.btnText, styles.btnTextPrimary]}>Применить</Text>
                            </TouchableOpacity>
                        </ScrollView>

                    </View>
                </View>
            </Modal>
        </>
    );
}
