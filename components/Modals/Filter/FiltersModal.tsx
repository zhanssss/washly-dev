// components/Filters/FiltersModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Switch,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    X,
    Car,
    SlidersHorizontal,
    MapPin,
    Star,
    DollarSign,
} from 'lucide-react-native';
import { colors } from '@/assets/Theme/colors';
import { styles } from './FiltersModal.styles';
import { useReferenceData } from '@/src/stores/useReferenceData';

interface FiltersModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: any) => void;
}

export default function FiltersModal({ visible, onClose, onApply }: FiltersModalProps) {
    const insets = useSafeAreaInsets();
    const { carBodyTypes, extraServices, cities, loading, load } = useReferenceData();

    const [selectedBody, setSelectedBody] = useState<string | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState<string>('0');
    const [maxPrice, setMaxPrice] = useState<string>('50000');
    const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price' | null>(null);
    const [isOpenNow, setIsOpenNow] = useState<boolean>(false);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    useEffect(() => {
        if (visible) load().catch(console.error);
    }, [visible]);

    const toggleExtra = (name: string) => {
        setSelectedExtras((prev) =>
            prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
        );
    };

    const resetFilters = () => {
        setSelectedBody(null);
        setSelectedExtras([]);
        setMinPrice('0');
        setMaxPrice('50000');
        setSortBy(null);
        setIsOpenNow(false);
        setSelectedCity(null);
    };

    const applyFilters = () => {
        onApply({
            body: selectedBody,
            extras: selectedExtras,
            priceRange: [Number(minPrice), Number(maxPrice)],
            sortBy,
            isOpenNow,
            city: selectedCity,
        });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>ФИЛЬТРЫ</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={22} color={colors.textDark} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={colors.accent} />
                        <Text style={{ color: colors.mutedText, marginTop: 8 }}>
                            Загрузка справочников…
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Кузов */}
                        <Text style={styles.sectionTitle}>Тип кузова</Text>
                        <View style={styles.optionsGrid}>
                            {carBodyTypes.map((b) => (
                                <TouchableOpacity
                                    key={b.id}
                                    style={[
                                        styles.optionButton,
                                        selectedBody === b.name && styles.optionButtonActive,
                                    ]}
                                    onPress={() => setSelectedBody(b.name)}
                                >
                                    <Car size={16} color={colors.accent} />
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedBody === b.name && styles.optionTextActive,
                                        ]}
                                    >
                                        {b.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Доп. услуги */}
                        <Text style={styles.sectionTitle}>Дополнительные услуги</Text>
                        <View style={styles.optionsGrid}>
                            {extraServices.map((e) => {
                                const active = selectedExtras.includes(e.name);
                                return (
                                    <TouchableOpacity
                                        key={e.id}
                                        style={[
                                            styles.optionButton,
                                            active && styles.optionButtonActive,
                                        ]}
                                        onPress={() => toggleExtra(e.name)}
                                    >
                                        <SlidersHorizontal size={16} color={colors.accent} />
                                        <Text
                                            style={[
                                                styles.optionText,
                                                active && styles.optionTextActive,
                                            ]}
                                        >
                                            {e.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Цена */}
                        <Text style={styles.sectionTitle}>Цена (₸)</Text>
                        <View style={styles.priceInputs}>
                            <TextInput
                                value={minPrice}
                                onChangeText={setMinPrice}
                                keyboardType="numeric"
                                placeholder="От"
                                style={styles.priceInput}
                            />
                            <Text style={styles.priceDash}>—</Text>
                            <TextInput
                                value={maxPrice}
                                onChangeText={setMaxPrice}
                                keyboardType="numeric"
                                placeholder="До"
                                style={styles.priceInput}
                            />
                        </View>

                        {/* Работает сейчас */}
                        <View style={styles.switchRow}>
                            <Text style={styles.sectionTitle}>Работает сейчас</Text>
                            <Switch
                                value={isOpenNow}
                                onValueChange={setIsOpenNow}
                                thumbColor={isOpenNow ? colors.accent : '#ccc'}
                            />
                        </View>

                        {/* Город */}
                        <Text style={styles.sectionTitle}>Город</Text>
                        <View style={styles.optionsGrid}>
                            {cities.length > 0 ? (
                                cities.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.optionButton,
                                            selectedCity === c.name && styles.optionButtonActive,
                                        ]}
                                        onPress={() => setSelectedCity(c.name)}
                                    >
                                        <MapPin size={16} color={colors.accent} />
                                        <Text
                                            style={[
                                                styles.optionText,
                                                selectedCity === c.name && styles.optionTextActive,
                                            ]}
                                        >
                                            {c.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ color: colors.mutedText }}>Нет доступных городов</Text>
                            )}
                        </View>

                        {/* Сортировка */}
                        <Text style={styles.sectionTitle}>Сортировка</Text>
                        <View style={styles.optionsGrid}>
                            {[
                                { key: 'distance', icon: MapPin, label: 'По расстоянию' },
                                { key: 'rating', icon: Star, label: 'По рейтингу' },
                                { key: 'price', icon: DollarSign, label: 'По цене' },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                const active = sortBy === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={[
                                            styles.optionButton,
                                            active && styles.optionButtonActive,
                                        ]}
                                        onPress={() => setSortBy(opt.key as any)}
                                    >
                                        <Icon size={16} color={colors.accent} />
                                        <Text
                                            style={[
                                                styles.optionText,
                                                active && styles.optionTextActive,
                                            ]}
                                        >
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Кнопки */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                                <Text style={styles.resetText}>Сбросить</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                                <Text style={styles.applyText}>Применить</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}
