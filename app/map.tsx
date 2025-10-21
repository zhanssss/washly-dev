// map.tsx
import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    KeyboardEventName,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ChevronLeft} from 'lucide-react-native';
import {router, useLocalSearchParams} from 'expo-router';
import CarWashMap from '@/components/CarWashMap/CarWashMap';
import {fetchCarWashes, type CarWash} from '@/src/services/api/carWashesApi';
import {styles} from '../assets/styles/map.styles';
import {Modalize} from 'react-native-modalize';
import BookingModal from '@/components/BookingModal/BookingModal';
import {CarWashMapHandle} from '@/components/CarWashMap/CarWashMap';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import BottomSheet, {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {Keyboard, Platform, Dimensions} from 'react-native';

import type {BookingSlot} from '@/src/data/carWashes';
import {
    fetchCarWashDetail,
    fetchBoxes,
    fetchBoxSlots,
    type CarWashDetail,
    type Box,
    type BoxSlotsResponse,
} from '@/src/services/api/carWashesApi';

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

    const center = useMemo(
        () =>
            lat && lng
                ? {latitude: Number(lat), longitude: Number(lng)}
                : {latitude: 43.222, longitude: 76.8512},
        [lat, lng]
    );

    const openBooking = (cw: CarWash) => {
        setSelectedWash(cw);
        bookingSheetRef.current?.open();
    };

    const filteredWashes = useMemo(() => {
        let arr = washes.filter(
            (w) =>
                w.name.toLowerCase().includes(search.toLowerCase()) ||
                w.address.toLowerCase().includes(search.toLowerCase())
        );

        if (showOpenOnly) {
            arr = arr.filter((w) => w.workingHoursDetailed?.is24Hours || w.open_now);
        }

        const cx = center.latitude;
        const cy = center.longitude;
        const withDist = arr.map((w) => ({
            ...w,
            _dist: haversineKm(cx, cy, w.latitude, w.longitude) || Number.POSITIVE_INFINITY,
        }));

        const cmp = (a: any, b: any) => {
            if (sortNearest) {
                if (a._dist !== b._dist) return a._dist - b._dist;
            }
            if (sortTopRated) {
                if (a.rating !== b.rating) return b.rating - a.rating;
            }
            return a.name.localeCompare(b.name);
        };

        return withDist.sort(cmp);
    }, [washes, search, showOpenOnly, sortNearest, sortTopRated, center]);

    const openCatalogToTop = () => {
        const ref: any = catalogSheetRef.current;
        if (!ref) return;
        if (ref.snapTo) ref.snapTo(420);
        else ref.open();
    };

    // @ts-ignore
    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/car-owner')} style={styles.backBtn}>
                    <ChevronLeft color="#FF6B35" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Карта автомоек</Text>
                <View style={{width: 24}} />
            </View>

            {/* Map */}
            <View style={styles.mapWrap}>
                {loading ? (
                    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                        <ActivityIndicator />
                        <Text style={{marginTop: 8, color: '#888'}}>Загрузка карты…</Text>
                    </View>
                ) : err ? (
                    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={{color: 'red'}}>{err}</Text>
                    </View>
                ) : (
                    <CarWashMap
                        ref={mapRef}
                        apiKey="739f9ccc-d467-4ed8-87b4-bae4175e8aff"
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
                            </View>
                            <View style={styles.chipsRow}>
                                <TouchableOpacity
                                    onPress={() => setSortNearest((v) => !v)}
                                    style={[styles.chip, sortNearest && styles.chipActive]}
                                >
                                    <Text style={[styles.chipText, sortNearest && styles.chipTextActive]}>Рядом</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setSortTopRated((v) => !v)}
                                    style={[styles.chip, sortTopRated && styles.chipActive]}
                                >
                                    <Text style={[styles.chipText, sortTopRated && styles.chipTextActive]}>Рейтинг</Text>
                                </TouchableOpacity>

                                {/*<TouchableOpacity*/}
                                {/*    onPress={() => setShowOpenOnly((v) => !v)}*/}
                                {/*    style={[styles.chip, showOpenOnly && styles.chipActive]}*/}
                                {/*>*/}
                                {/*    <Text style={[styles.chipText, showOpenOnly && styles.chipTextActive]}>Открыто</Text>*/}
                                {/*</TouchableOpacity>*/}
                            </View>
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
        </View>
    );
}
