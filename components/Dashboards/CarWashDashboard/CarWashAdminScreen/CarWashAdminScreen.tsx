import React, {useEffect, useRef, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    Alert,
    Image,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import {styles} from '../CarWashDashboard.styles';
import SelectList from '@/components/SelectList';
import {MapPin, Plus, Minus, Upload, X} from 'lucide-react-native';
import {api} from '@/contexts/AuthContext';
import {useAuthStore} from '@/src/stores/authStore';
import {API_BASE_URL, GIS_API_KEY} from '@/src/config/env';
import TwoGisSearchModal from '@/components/Modals/TwoGisSearchModal/TwoGisSearchModal';
import {useReferenceData} from '@/src/stores/useReferenceData';
import placeholderWash from '@/assets/images/placeholders/carwash_placeholder.jpg';

type BodyType = { id: string; name: string };
type BaseService = { id: string; name: string };

const isLocalUri = (u?: string | null) =>
    !!u && (u.startsWith('file://') || u.startsWith('content://'));

const buildSetupForm = (p: {
    car_wash_id: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    two_gis_id?: string | null;
    open_time?: string;
    close_time?: string;
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

const CarWashAdminScreen: React.FC = () => {
    const user = useAuthStore(s => s.user);
    const insets = useSafeAreaInsets();
    const keyboardOffset = Platform.OS === 'ios' ? insets.top + 56 : 0;

    const [twoGisPlaceId, setTwoGisPlaceId] = useState<string | null>(null);
    const [placeTitle, setPlaceTitle] = useState<string>('');
    const [placeRating, setPlaceRating] = useState<number | null>(null);
    const [placeAddress, setPlaceAddress] = useState<string>('');
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [placePhotoUrl, setPlacePhotoUrl] = useState<string | null>(null);
    const [lat, setLat] = useState<number | null>(null);
    const [lon, setLon] = useState<number | null>(null);

    const [openTime, setOpenTime] = useState<string>('08:00');
    const [closeTime, setCloseTime] = useState<string>('22:00');
    const [openTimeError, setOpenTimeError] = useState<string | null>(null);
    const [closeTimeError, setCloseTimeError] = useState<string | null>(null);

    const closeTimeRef = useRef<TextInput>(null);

    const validateTime = (time: string): boolean => {
        if (!/^\d{2}:\d{2}$/.test(time)) return false;
        const [hh, mm] = time.split(':').map(Number);
        return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
    };

    const formatTime = (text: string) => {
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

    const {
        carBodyTypes,
        extraServices,
        load: loadRefs,
    } = useReferenceData();

    const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
    const [baseServices, setBaseServices] = useState<BaseService[]>([]);

    const [washBays, setWashBays] = useState<number>(1);
    const [pricesByBody, setPricesByBody] = useState<Record<string, string>>({});
    const [basePrices, setBasePrices] = useState<Record<string, string>>({});
    const [customServices, setCustomServices] = useState<{ id: string; name: string; price: string }[]>([]);
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');

    const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
    const [selectedBaseServiceId, setSelectedBaseServiceId] = useState<string | null>(null);

    const [chosenBodyIds, setChosenBodyIds] = useState<string[]>([]);
    const [chosenBaseServiceIds, setChosenBaseServiceIds] = useState<string[]>([]);

    useEffect(() => {
        loadRefs();
    }, [loadRefs]);

    useEffect(() => {
        setBodyTypes(carBodyTypes.map(b => ({id: String(b.id), name: b.name})));
        setBaseServices(extraServices.map(s => ({id: String(s.id), name: s.name})));

        setSelectedBodyId(prev => prev ?? (carBodyTypes[0] ? String(carBodyTypes[0].id) : null));
        setSelectedBaseServiceId(prev => prev ?? (extraServices[0] ? String(extraServices[0].id) : null));
    }, [carBodyTypes, extraServices]);

    useEffect(() => {
        const fetchCarWash = async () => {
            try {
                if (!user?.id) return;
                const carWashId = user?.carWashDetails?.id ?? user?.id;
                const {data} = await api.get(`/dashboard/carwashes/${carWashId}/`, {
                    baseURL: API_BASE_URL,
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
                console.error('Ошибка загрузки автомойки:', e);
            }
        };

        fetchCarWash();
    }, [user?.id]);

    const handlePickCustomPhoto = async () => {
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

    const addBay = () => setWashBays(v => v + 1);
    const removeBay = () => setWashBays(v => Math.max(1, v - 1));

    const setBodyPrice = (id: string, value: string) =>
        setPricesByBody(prev => ({...prev, [id]: value.replace(/[^\d]/g, '')}));

    const setBaseServicePrice = (id: string, value: string) =>
        setBasePrices(prev => ({...prev, [id]: value.replace(/[^\d]/g, '')}));

    const addBodyRow = () => {
        if (selectedBodyId && !chosenBodyIds.includes(selectedBodyId)) {
            setChosenBodyIds(prev => [...prev, selectedBodyId]);
        }
    };

    const removeBodyRow = (id: string) => {
        setChosenBodyIds(prev => prev.filter(x => x !== id));
        setPricesByBody(prev => {
            const updated = {...prev};
            delete updated[id];
            return updated;
        });
    };

    const addBaseServiceRow = () => {
        if (selectedBaseServiceId && !chosenBaseServiceIds.includes(selectedBaseServiceId)) {
            setChosenBaseServiceIds(prev => [...prev, selectedBaseServiceId]);
        }
    };

    const removeBaseServiceRow = (id: string) => {
        setChosenBaseServiceIds(prev => prev.filter(x => x !== id));
        setBasePrices(prev => {
            const updated = {...prev};
            delete updated[id];
            return updated;
        });
    };

    const addCustomService = () => {
        const name = newServiceName.trim();
        const price = newServicePrice.trim().replace(/[^\d]/g, '');
        if (!name || !price) {
            Alert.alert('Заполните поля', 'Введите название и цену');
            return;
        }
        setCustomServices(prev => [...prev, {id: `${Date.now()}`, name, price}]);
        setNewServiceName('');
        setNewServicePrice('');
    };

    const removeCustomService = (id: string) =>
        setCustomServices(prev => prev.filter(s => s.id !== id));

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
            imgUri: placePhotoUrl ?? null,
        });

        try {
            const res = await api.postForm(`/dashboard/carwash/setup/`, form, {
                baseURL: API_BASE_URL,
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
            Alert.alert('Ошибка', String(msg));
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
                    enableOnAndroid
                    extraScrollHeight={80}
                    enableResetScrollToCoords={false}
                >
                    <Text style={styles.blockTitle}>Адрес и данные</Text>

                    <View style={styles.card}>
                        <View style={styles.gap12}>
                            <TouchableOpacity
                                style={[styles.primaryBtn, styles.primaryBtnWide]}
                                onPress={() => setIsMapOpen(true)}
                            >
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
                                    source={placePhotoUrl ? {uri: placePhotoUrl} : placeholderWash}
                                    style={styles.photo}
                                />
                                <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickCustomPhoto}>
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
                                        openTimeError && {borderColor: 'red'},
                                    ]}
                                    value={openTime}
                                    placeholder="ЧЧ:ММ"
                                    onChangeText={handleOpenTimeChange}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    returnKeyType="next"
                                />
                                {openTimeError && (
                                    <Text style={{color: 'red', fontSize: 12}}>{openTimeError}</Text>
                                )}
                            </View>

                            <View style={{flex: 1}}>
                                <TextInput
                                    ref={closeTimeRef}
                                    style={[
                                        styles.input,
                                        closeTimeError && {borderColor: 'red'},
                                    ]}
                                    value={closeTime}
                                    placeholder="ЧЧ:ММ"
                                    onChangeText={handleCloseTimeChange}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    returnKeyType="done"
                                />
                                {closeTimeError && (
                                    <Text style={{color: 'red', fontSize: 12}}>{closeTimeError}</Text>
                                )}
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
                                    onSelect={id => setSelectedBodyId(id)}
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
                            {chosenBodyIds.map(id => {
                                const bt = bodyTypes.find(b => b.id === id);
                                if (!bt) return null;
                                return (
                                    <View key={id} style={styles.priceRow}>
                                        <Text style={styles.label}>{bt.name}</Text>
                                        <View style={styles.priceRow}>
                                            <TextInput
                                                style={[
                                                    styles.priceInput,
                                                    (!pricesByBody[id] || Number(pricesByBody[id]) <= 0) && {borderColor: 'red'},
                                                ]}
                                                placeholder="Цена, ₸"
                                                keyboardType="numeric"
                                                value={pricesByBody[id] || ''}
                                                onChangeText={v => setBodyPrice(id, v)}
                                            />
                                            <TouchableOpacity onPress={() => removeBodyRow(id)} style={styles.counterBtn}>
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
                                    onSelect={id => setSelectedBaseServiceId(id)}
                                    placeholder="Выбрать услугу"
                                    safeTop={insets.top}
                                    safeBottom={insets.bottom}
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
                            {chosenBaseServiceIds.map(id => {
                                const svc = baseServices.find(s => s.id === id);
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
                                                onChangeText={v => setBaseServicePrice(id, v)}
                                            />
                                            <TouchableOpacity onPress={() => removeBaseServiceRow(id)} style={styles.counterBtn}>
                                                <X color="#fff" size={16}/>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Кастомные услуги, если нужно – можно дореализовать UI */}

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
                onConfirm={p => {
                    if (p.id) setTwoGisPlaceId(p.id);
                    if (p.address) setPlaceAddress(p.address);
                    setLat(p.latitude);
                    setLon(p.longitude);
                    setIsMapOpen(false);
                }}
            />
        </View>
    );
};

export default CarWashAdminScreen;
