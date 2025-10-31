// app/(auth)/CarRegistration.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import {ArrowRight, Car} from 'lucide-react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {KeyboardAvoidingView} from 'react-native';
import {useAuth} from '@/contexts/AuthContext';
import {useAuthStore} from '@/src/stores/authStore';
import {useReferenceData} from '@/src/stores/useReferenceData';
import SelectList from '@/components/SelectList';
import {styles} from './CarRegistration.styles';

const DismissKeyboard: React.FC<React.PropsWithChildren> = ({children}) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {children}
    </TouchableWithoutFeedback>
);

export default function CarRegistration() {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<KeyboardAwareScrollView>(null);
    const plateRef = useRef<TextInput>(null);

    const [licensePlate, setLicensePlate] = useState('');
    const [bodyTypeId, setBodyTypeId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {registerDriver, tempPhone} = useAuth();

    const {carBodyTypes, loading: refLoading, error: refError, load: loadRefs} = useReferenceData();

    useEffect(() => {
        loadRefs();
    }, [loadRefs]);

    useEffect(() => {
        if (!refLoading && carBodyTypes.length && bodyTypeId == null) setBodyTypeId(carBodyTypes[0].id);
    }, [refLoading, carBodyTypes, bodyTypeId]);

    const formatKazakhLicensePlate = (text: string): string => {
        const cleaned = text.replace(/[^А-Яа-яA-Za-z0-9]/g, '').toUpperCase();
        if (cleaned.length > 8) return licensePlate;
        return cleaned;
    };

    const validateKazakhLicensePlate = (plate: string): boolean => {
        const oldFormat = /^[А-ЯA-Z]{1}[0-9]{3}[А-ЯA-Z]{2}[0-9]{2}$/;
        const newFormat = /^[0-9]{3}[А-ЯA-Z]{3}[0-9]{2}$/;
        return oldFormat.test(plate) || newFormat.test(plate);
    };

    const handleLicensePlateChange = (text: string) => setLicensePlate(formatKazakhLicensePlate(text));

    const selectedBody = useMemo(
        () => carBodyTypes.find((b) => b.id === bodyTypeId) || null,
        [carBodyTypes, bodyTypeId]
    );

    const isFormValid = validateKazakhLicensePlate(licensePlate) && !!bodyTypeId;

    const handleComplete = async () => {
        if (!licensePlate) return Alert.alert('Ошибка', 'Введите госномер');
        if (!validateKazakhLicensePlate(licensePlate)) {
            return Alert.alert('Ошибка', 'Введите корректный казахстанский госномер\n(например: А123БВ02, A123BF02 или 123АВС02)');
        }
        if (!tempPhone) return Alert.alert('Ошибка', 'Телефон отсутствует. Вернитесь и введите телефон.');
        if (!bodyTypeId) return Alert.alert('Ошибка', 'Выберите тип кузова');

        setIsLoading(true);
        try {
            const payload = {
                phone: tempPhone,
                car_number: licensePlate,
                car_body: bodyTypeId!, // бэк ждёт id кузова
            };
            const result = await registerDriver(payload as any);
            if (!result.success) {
                Alert.alert('Ошибка', result.error ? String(result.error) : 'Не удалось завершить регистрацию');
            }
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при регистрации');
        } finally {
            setIsLoading(false);
        }
    };

    // учитываем высоту шапки как в админке (safe area + условные 56)
    const keyboardOffset = Platform.OS === 'ios' ? insets.top + 56 : 0;

    return (
        <SafeAreaView style={styles.container}>
            <DismissKeyboard>
                <KeyboardAvoidingView
                    style={{flex: 1}}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={keyboardOffset}
                >
                    <KeyboardAwareScrollView
                        ref={scrollRef}
                        contentContainerStyle={[styles.content, {paddingBottom: 24 + insets.bottom}]}
                        keyboardShouldPersistTaps="handled"
                        enableOnAndroid
                        enableAutomaticScroll
                        extraScrollHeight={24}
                    >
                        <View style={styles.header}>
                            <View style={styles.iconContainer}><Car color="#14213D" size={56}/></View>
                            <Text style={styles.title}>ДАННЫЕ АВТОМОБИЛЯ</Text>
                            <Text style={styles.description}>Заполните информацию о вашем автомобиле</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Номер телефона (используемый для регистрации)</Text>
                                <Text style={{color: '#888', marginBottom: 8}}>{tempPhone || 'Телефон не задан'}</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Госномер (Казахстан)</Text>
                                <TextInput
                                    ref={plateRef}
                                    style={[
                                        styles.input,
                                        !validateKazakhLicensePlate(licensePlate) && licensePlate.length > 0 && styles.inputError,
                                    ]}
                                    value={licensePlate}
                                    onChangeText={handleLicensePlateChange}
                                    placeholder="А123БВ02, A123BF02 или 123АВС02"
                                    placeholderTextColor="#666666"
                                    maxLength={8}
                                    autoCapitalize="characters"
                                    testID="license-plate-input"
                                    onFocus={() => {
                                        if (scrollRef.current && plateRef.current) {
                                            scrollRef.current.scrollToFocusedInput(plateRef.current);
                                        }
                                    }}
                                    returnKeyType="done"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Тип кузова</Text>
                                    <SelectList
                                        items={carBodyTypes.map(b => ({id: b.id, name: b.name}))}
                                        selectedId={bodyTypeId}
                                        onSelect={(id) => setBodyTypeId(Number(id))}
                                        placeholder={refLoading ? 'Загрузка…' : 'Выберите тип кузова'}
                                        safeTop={insets.top}
                                        safeBottom={insets.bottom}
                                        triggerStyle={styles.picker}
                                        textStyle={styles.pickerText}
                                    />
                                {!!refError && (
                                    <Text style={{color: '#ff5252', marginTop: 6}}>
                                        Не загрузили типы кузова: {refError}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, (!isFormValid || isLoading) && styles.buttonDisabled]}
                            onPress={handleComplete}
                            disabled={!isFormValid || isLoading}
                            testID="complete-registration-button"
                        >
                            <Text
                                style={styles.buttonText}>{isLoading ? 'ЗАВЕРШЕНИЕ...' : 'ЗАВЕРШИТЬ РЕГИСТРАЦИЮ'}</Text>
                            <ArrowRight color="#fff" size={20}/>
                        </TouchableOpacity>
                    </KeyboardAwareScrollView>
                </KeyboardAvoidingView>
            </DismissKeyboard>
        </SafeAreaView>
    );
}
