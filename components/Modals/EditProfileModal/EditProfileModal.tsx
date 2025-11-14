import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { saveUserSnapshot } from '@/src/auth/token';
import { Camera, X, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useReferenceData } from '@/src/stores/useReferenceData';
import { colors } from '@/assets/Theme/colors';
import { api, useAuth } from '@/contexts/AuthContext';
import { styles } from './EditProfileModal.styles';
import SelectList from '@/components/SelectList/SelectList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const EditProfileModal: React.FC<Props> = ({ visible, onClose }) => {
    const accessToken = useAuthStore((s) => s.accessToken);
    const clientMe = useAuthStore((s) => s.clientMe);
    const { user, setUser } = useAuth();
    const insets = useSafeAreaInsets();

    const {
        brands,
        colors: colorList,
        cities,
        carBodyTypes,
        load,
        loading: refLoading,
    } = useReferenceData();

    // Внутренние поля формы — в терминах /client/me
    const [name, setName] = useState<string>('');
    const [licensePlate, setLicensePlate] = useState<string>('');
    const [brandId, setBrandId] = useState<number | null>(null);
    const [model, setModel] = useState<string>('');
    const [colorId, setColorId] = useState<number | null>(null);
    const [cityId, setCityId] = useState<number | null>(null);
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);

    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Подгружаем справочники, когда модалка открывается
    useEffect(() => {
        if (visible) load(accessToken);
    }, [visible, accessToken, load]);

    // Префилл полей формы из clientMe (первично) и user (бэкап)
    useEffect(() => {
        if (!visible) return;

        const u = user;
        const cm = clientMe;

        setName(u?.username ?? cm?.username ?? '');
        setLicensePlate(
            u?.car_number ?? cm?.car_number ?? u?.carDetails?.licensePlate ?? ''
        );
        setModel(u?.car_model ?? cm?.car_model ?? u?.carDetails?.model ?? '');
        setBrandId((u?.brand ?? cm?.brand) ?? null);
        setCityId((u?.city ?? cm?.city) ?? null);
        setColorId((u?.color ?? cm?.color) ?? null);

        const body =
            (typeof u?.car_body === 'number' ? u?.car_body : undefined) ??
            (typeof cm?.car_body === 'number' ? cm?.car_body : undefined) ??
            null;
        setSelectedBodyId(body);
    }, [visible, user, clientMe]);

    const pickFrom = async (source: 'camera' | 'library') => {
        try {
            const permission =
                source === 'camera'
                    ? await ImagePicker.requestCameraPermissionsAsync()
                    : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permission.status !== 'granted') {
                Alert.alert('Разрешение', 'Нет доступа к выбранному источнику');
                return;
            }

            const result =
                source === 'camera'
                    ? await ImagePicker.launchCameraAsync({
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                    })
                    : await ImagePicker.launchImageLibraryAsync({
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                    });

            if (result.canceled || !result.assets[0]) return;

            const img = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: 300, height: 300 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            setAvatarUri(img.uri);
        } catch {
            Alert.alert('Ошибка', 'Не удалось выбрать фото');
        }
    };

    const onSave = async () => {
        if (!licensePlate.trim())
            return Alert.alert('Профиль', 'Введите гос. номер');
        if (!selectedBodyId)
            return Alert.alert('Профиль', 'Выберите тип кузова');

        try {
            setSaving(true);

            const payload = {
                id: user?.id,
                phone: user?.phone,
                registered_at: user?.registered_at,
                username: name?.trim() || user?.username,
                car_number: licensePlate.trim().toUpperCase(),
                car_body: selectedBodyId,
                last_wash: user?.last_wash ?? null,
                brand: brandId ?? user?.brand ?? null,
                city: cityId ?? user?.city ?? null,
                color: colorId ?? user?.color ?? null,
                car_model: model || user?.car_model || '',
            };

            await api.patch('/client/me/', payload);

            // Рефетчим каноничный профиль
            const meResp = await api.get('/client/me/');
            const fresh = meResp.data as any;

            // Имя кузова для блока carDetails
            const bodyName =
                carBodyTypes.find((b) => b.id === Number(fresh.car_body))?.name ??
                (user?.carDetails?.bodyType ?? '');

            // Собираем nextUser для AuthContext
            const nextUser = {
                ...(user as any),
                username: fresh.username,
                registered_at: fresh.registered_at,
                last_wash: fresh.last_wash ?? null,
                car_number: fresh.car_number,
                car_body: fresh.car_body,
                brand: fresh.brand ?? null,
                city: fresh.city ?? null,
                color: fresh.color ?? null,
                car_model: fresh.car_model ?? '',
                carDetails: {
                    ...(user as any)?.carDetails,
                    licensePlate: fresh.car_number,
                    model: fresh.car_model ?? '',
                    bodyType: bodyName,
                    // Если нужно имя цвета — можно сопоставить из colorList здесь
                    // color: colorList.find(c => c.id === fresh.color)?.name ?? ...
                },
            };

            // 1) Обновляем контекст
            setUser(nextUser);

            // 2) Обновляем персист-снапшот
            await saveUserSnapshot(nextUser);

            // 3) Обновляем zustand (clientMe + user)
            const { setClientMe, setAuthUser: setAuthUserStore } =
                useAuthStore.getState();
            setClientMe(fresh);
            setAuthUserStore(nextUser);

            Alert.alert('Профиль', 'Данные обновлены');
            onClose();
        } catch (e: any) {
            Alert.alert('Ошибка', e?.message ?? 'Не удалось сохранить профиль');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>РЕДАКТИРОВАНИЕ ПРОФИЛЯ</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X color={colors.mutedText} size={20} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.avatarWrap}>
                        <TouchableOpacity
                            onPress={() =>
                                Alert.alert('Фото профиля', 'Выберите источник', [
                                    { text: 'Камера', onPress: () => pickFrom('camera') },
                                    { text: 'Галерея', onPress: () => pickFrom('library') },
                                    { text: 'Отмена', style: 'cancel' },
                                ])
                            }
                            style={styles.avatarButton}
                        >
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <User color={colors.accent} size={40} />
                            )}
                            <View style={!avatarUri && styles.cameraBadge}>
                                {!avatarUri ? <Camera color="#fff" size={14} /> : <></>}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Фото</Text>
                    </View>

                    <Text style={styles.label}>Имя</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Введите имя"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Гос. номер *</Text>
                    <TextInput
                        autoCapitalize="characters"
                        value={licensePlate}
                        onChangeText={(t) => setLicensePlate(t.toUpperCase())}
                        placeholder="123ABC"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Тип кузова *</Text>
                    {refLoading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator />
                        </View>
                    ) : (
                        <View style={styles.bodyWrap}>
                            {carBodyTypes.map((b) => {
                                const active = selectedBodyId === b.id;
                                return (
                                    <TouchableOpacity
                                        key={b.id}
                                        onPress={() => setSelectedBodyId(b.id)}
                                        style={[styles.chip, active && styles.chipActive]}
                                    >
                                        <Text
                                            style={[styles.chipText, active && styles.chipTextActive]}
                                        >
                                            {b.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <Text style={styles.label}>Марка</Text>
                    <SelectList
                        items={brands.map((b) => ({ id: b.id, name: b.name }))}
                        selectedId={brandId}
                        onSelect={(id) => setBrandId(Number(id))}
                        placeholder="Выберите марку"
                        safeTop={insets.top}
                        safeBottom={insets.bottom}
                    />

                    <Text style={styles.label}>Модель</Text>
                    <TextInput
                        value={model}
                        onChangeText={setModel}
                        placeholder="Введите модель"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Цвет</Text>
                    <View style={styles.colorGrid}>
                        {colorList.map((c) => {
                            const active = colorId === c.id;
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    onPress={() => setColorId(c.id)}
                                    style={[
                                        styles.colorDotWrap,
                                        active && styles.colorDotWrapActive,
                                    ]}
                                    activeOpacity={0.9}
                                >
                                    <View
                                        style={[
                                            styles.colorDot,
                                            active && styles.colorDotActive,
                                            { backgroundColor: c.hex_code },
                                        ]}
                                    />
                                    <Text style={styles.colorName} numberOfLines={1}>
                                        {c.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.label}>Город</Text>
                    <SelectList
                        items={cities.map((c) => ({ id: c.id, name: c.name }))}
                        selectedId={cityId}
                        onSelect={(id) => setCityId(Number(id))}
                        placeholder="Выберите город"
                        safeTop={insets.top}
                        safeBottom={insets.bottom}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity
                            disabled={saving}
                            onPress={onSave}
                            style={[styles.primaryButton, saving && { opacity: 0.6 }]}
                        >
                            <Text style={styles.primaryButtonText}>
                                {saving ? 'СОХРАНЯЕМ…' : 'СОХРАНИТЬ'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>ОТМЕНА</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

export default EditProfileModal;
