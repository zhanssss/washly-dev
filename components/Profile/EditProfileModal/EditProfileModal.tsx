import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { Camera, X, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useReferenceData } from '@/src/stores/useReferenceData';
import { colors } from '@/assets/Theme/colors';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { styles } from './EditProfileModal.styles';
import SelectList from '@/components/SelectList';
import { CAR_BRANDS, getModelsByBrand } from '@/src/data/carBrands';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const EditProfileModal: React.FC<Props> = ({ visible, onClose }) => {
    const { user, setUser } = useAuth();
    const insets = useSafeAreaInsets();

    const { carBodyTypes, load, loading: refLoading } = useReferenceData();

    const [name, setName] = useState<string>(user?.name || user?.carDetails?.ownerName || '');
    const [licensePlate, setLicensePlate] = useState<string>(user?.carDetails?.licensePlate || '');
    const [brand, setBrand] = useState<string>(user?.carDetails?.brand || '');
    const [model, setModel] = useState<string>(user?.carDetails?.model || '');
    const [color, setColor] = useState<string>(user?.carDetails?.color || '');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const updateOwnerMutation = trpc.profile.updateCarOwner.useMutation();
    const uploadPhotoMutation = trpc.profile.uploadPhoto.useMutation();

    const bodyNameById = useMemo(() => {
        const m = new Map(carBodyTypes.map(b => [b.id, b.name]));
        return (id?: number | null) => (id && m.get(id)) || '';
    }, [carBodyTypes]);

// элементы для SelectList
    const brandItems = useMemo(
        () => CAR_BRANDS.map(b => ({ id: b.name, name: b.name })),
        []
    );

// имя кузова по выбранному id
    const selectedBodyName = useMemo(
        () => bodyNameById(selectedBodyId) || '',
        [selectedBodyId, bodyNameById]
    );

// модели — только под выбранный кузов (если кузов не выбран, показываем все модели бренда)
    const modelItems = useMemo(
        () => (brand
            ? getModelsByBrand(brand, selectedBodyName || undefined).map(m => ({ id: m, name: m }))
            : []),
        [brand, selectedBodyName]
    );

    // если юзер поменял кузов/марку — удаляем несоответствующую модель
    useEffect(() => {
        if (!brand || !model) return;
        const allowed = getModelsByBrand(brand, selectedBodyName || undefined);
        if (!allowed.includes(model)) {
            setModel('');
        }
    }, [brand, selectedBodyName]); // model в зависимостях не нужен — мы его здесь сбрасываем



    useEffect(() => {
        if (!visible) return;
        if (!carBodyTypes.length) load();
    }, [visible]);

    useEffect(() => {
        if (!visible || !carBodyTypes.length) return;
        const bodyName = user?.carDetails?.bodyType?.toLowerCase?.() || '';
        const found = carBodyTypes.find(b => b.name.toLowerCase() === bodyName);
        if (found) setSelectedBodyId(found.id);
    }, [visible, carBodyTypes.length]);

    const pickFrom = async (source: 'camera' | 'library') => {
        try {
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Разрешение', 'Нужен доступ к камере'); return; }
                const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.8 });
                if (r.canceled || !r.assets[0]) return;
                const img = await ImageManipulator.manipulateAsync(
                    r.assets[0].uri,
                    [{ resize: { width: 300, height: 300 } }],
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );
                setAvatarUri(img.uri);
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Разрешение', 'Нужен доступ к галерее'); return; }
                const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.8 });
                if (r.canceled || !r.assets[0]) return;
                const img = await ImageManipulator.manipulateAsync(
                    r.assets[0].uri,
                    [{ resize: { width: 300, height: 300 } }],
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );
                setAvatarUri(img.uri);
            }
        } catch {
            Alert.alert('Ошибка', 'Не удалось выбрать фото');
        }
    };



    const onSave = async () => {
        if (!licensePlate.trim()) return Alert.alert('Профиль', 'Введите гос. номер');
        if (!selectedBodyId) return Alert.alert('Профиль', 'Выберите тип кузова');

        try {
            setSaving(true);

            if (avatarUri) {
                try {
                    await uploadPhotoMutation.mutateAsync({
                        userId: user?.id || 'default',
                        photoUri: avatarUri,
                        type: 'car-owner',
                    });
                } catch {}
            }

            const payload = {
                userId: user?.id || 'default',
                name: name?.trim() ? name.trim() : undefined,
                phone: user?.phone || undefined,
                carDetails: {
                    ownerName: name?.trim() || user?.carDetails?.ownerName || '',
                    licensePlate: licensePlate.trim().toUpperCase(),
                    brand: brand?.trim() || user?.carDetails?.brand || '',
                    model: model || (user?.carDetails?.model ?? ''), // <-- селект модели (опционально)
                    bodyType: bodyNameById(selectedBodyId) || (user?.carDetails?.bodyType ?? ''),
                    color: color.trim() || undefined,          // опционально
                },
            } as const;


            await updateOwnerMutation.mutateAsync(payload);

            setUser(prev => prev ? {
                ...prev,
                name: payload.name ?? prev.name,
                carDetails: {
                    ...(prev.carDetails || { ownerName: '', licensePlate: '', brand: '', model: '', bodyType: '' }),
                    ...payload.carDetails,
                }
            } : prev);

            Alert.alert('Профиль', 'Данные обновлены');
            onClose();
        } catch (e: any) {
            Alert.alert('Ошибка', e?.message ?? 'Не удалось сохранить профиль');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>РЕДАКТИРОВАНИЕ ПРОФИЛЯ</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X color={colors.mutedText} size={20} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {/* Фото */}
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
                            <View style={styles.cameraBadge}>
                                <Camera color="#fff" size={14} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Фото — необязательно</Text>
                    </View>

                    {/* Имя */}
                    <Text style={styles.label}>Имя (необязательно)</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Введите имя"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />

                    {/* Гос номер */}
                    <Text style={styles.label}>Гос. номер *</Text>
                    <TextInput
                        autoCapitalize="characters"
                        value={licensePlate}
                        onChangeText={t => setLicensePlate(t.toUpperCase())}
                        placeholder="123ABC"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />

                    {/* Кузов */}
                    <Text style={styles.label}>Тип кузова *</Text>
                    {refLoading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator />
                        </View>
                    ) : (
                        <View style={styles.bodyWrap}>
                            {carBodyTypes.map(b => {
                                const active = selectedBodyId === b.id;
                                return (
                                    <TouchableOpacity
                                        key={b.id}
                                        onPress={() => setSelectedBodyId(b.id)}
                                        style={[styles.chip, active && styles.chipActive]}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{b.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <Text style={styles.label}>Марка (необязательно)</Text>
                    <SelectList
                        items={brandItems}
                        selectedId={brand || null}
                        onSelect={(id) => {
                            setBrand(String(id));
                            setModel(''); // сброс модели при смене марки
                        }}
                        placeholder="Выберите марку"
                        safeTop={insets.top}
                        safeBottom={insets.bottom}
                    />

                    <View style={styles.spacer12} />

                    <Text style={styles.label}>Модель (необязательно)</Text>
                    <SelectList
                        items={modelItems}
                        selectedId={model || null}
                        onSelect={(id) => setModel(String(id))}
                        placeholder={
                            !brand
                                ? 'Сначала выберите марку'
                                : selectedBodyName
                                    ? `Модели для кузова: ${selectedBodyName}`
                                    : 'Выберите модель'
                        }
                        safeTop={insets.top}
                        safeBottom={insets.bottom}
                        triggerStyle={!brand ? { opacity: 0.6 } : undefined}
                    />

                    <View style={styles.spacer12} />

                    {/* Цвет */}
                    <Text style={styles.label}>Цвет (необязательно)</Text>
                    <TextInput
                        value={color}
                        onChangeText={setColor}
                        placeholder="Белый"
                        placeholderTextColor="#9CA3AF"
                        style={styles.inputLast}
                    />

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            disabled={saving}
                            onPress={onSave}
                            style={[styles.primaryButton, saving && { opacity: 0.6 }]}
                        >
                            <Text style={styles.primaryButtonText}>{saving ? 'СОХРАНЯЕМ…' : 'СОХРАНИТЬ'}</Text>
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
