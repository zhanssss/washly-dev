// AuthScreen.tsx
import React, {useState, useCallback} from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
    BackHandler, ScrollView
} from 'react-native';
import {styles} from './AuthScreen.styles';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {ArrowLeft, Phone, ArrowRight, User, Car, Waves, Lock} from 'lucide-react-native';
import {useAuth} from '@/contexts/AuthContext';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view'; // поставь пакет

const DismissKeyboard: React.FC<React.PropsWithChildren> = ({children}) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {children}
    </TouchableWithoutFeedback>
);

// Нормализуем номер: оставляем только цифры (без +, пробелов, скобок, дефисов)
const normalizePhone = (raw: string) => (raw || '').replace(/\D/g, '');

// UI-форматтер для поля ввода (оставлен как у тебя)
const formatPhone = (text: string, prev: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 11) return prev;
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 1) return `+7 (${cleaned}`;
    if (cleaned.length <= 4) return `+7 (${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
};

const BackButton: React.FC<{ visible: boolean; onPress: () => void }> = ({visible, onPress}) => {
    if (!visible) return null;
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.backFab} // стиль добавим ниже в .styles.ts
            hitSlop={{top: 10, left: 10, right: 10, bottom: 10}}
        >
            <ArrowLeft color="#14213D" size={22}/>
        </TouchableOpacity>
    );
};


export default function AuthScreen() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const keyboardOffset = Platform.OS === 'ios' ? insets.top : 0; // если есть stack header, прибавь его высоту


    // Добавили шаг verify
    const [step, setStep] = useState<'login' | 'choice' | 'reset-password' | 'registration' | 'verify'>('choice');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetStep, setResetStep] = useState<'send-code' | 'verify-code' | 'new-password'>('send-code');
    const [loginAttempts, setLoginAttempts] = useState(0);

    // Флаг: номер существует на бэке (нужно для навигации после verify)
    const [phoneExists, setPhoneExists] = useState<boolean | null>(null);
    // Код из SMS для обычной верификации (не для сброса пароля)
    const [smsCode, setSmsCode] = useState('');

    const {
        sendVerificationCode,          // отправка SMS-кода для входа/регистрации
        verifyCode: verifySmsCode,     // ✅ алиас, чтобы не конфликтовать с локальным стейтом
        loginWithPassword,
        sendPasswordResetCode,
        verifyPasswordResetCode,
        resetPassword,
        saveTempPhone,
        userType,
        setUserType,
    } = useAuth();

    const handlePhoneChange = useCallback((text: string) => {
        setPhone(curr => formatPhone(text, curr));
    }, []);


    const goBackStep = React.useCallback(() => {
        // Блокируем выход, если идёт запрос
        if (isLoading) return true;

        if (step === 'verify') {
            setStep('registration');
            return true;
        }
        if (step === 'registration') {
            setStep('choice');
            return true;
        }
        if (step === 'login') {
            setStep('choice');
            return true;
        }

        if (step === 'reset-password') {
            if (resetStep === 'new-password') {
                setResetStep('verify-code');
                return true;
            }
            if (resetStep === 'verify-code') {
                setResetStep('send-code');
                return true;
            }
            if (resetStep === 'send-code') {
                setStep('login');
                return true;
            }
        }

        // На экране выбора (choice) — отдать управление ОС (закрыть экран/приложение)
        return false;
    }, [step, resetStep, isLoading, setStep, setResetStep]);

    React.useEffect(() => {
        if (Platform.OS !== 'android') return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            const handled = goBackStep();
            return true; // всегда перехватываем, чтобы не выходило внезапно
        });
        return () => sub.remove();
    }, [goBackStep]);

    const showBack = step !== 'choice';

    // Выбор роли
    const handleUserTypeChoice = async (type: 'car-owner' | 'car-wash') => {
        setIsLoading(true);
        try {
            if (type === 'car-owner') {
                setUserType('car-owner');
                if (phone) saveTempPhone(normalizePhone(phone)); // сохраняем нормализованный
                setStep('registration'); // ввод телефона для регистрации
            } else {
                setUserType('car-wash');
                setStep('login');        // вход с паролем
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Регистрация (ввод телефона) → проверка на бэке → отправка SMS → шаг verify
    const handleRegistrationContinue = async () => {
        if (!phone || phone.length < 18) {
            Alert.alert('Ошибка', 'Введите корректный номер телефона');
            return;
        }
        const apiPhone = normalizePhone(phone);
        setIsLoading(true);
        try {
            const sent = await sendVerificationCode(apiPhone);
            if (!sent?.success) {
                Alert.alert('Ошибка', sent?.error || 'Не удалось отправить код');
                return;
            }
            saveTempPhone(apiPhone);
            setStep('verify');
        } catch {
            Alert.alert('Ошибка', 'Не удалось отправить код. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    // Подтверждение 4-значного кода → роут в зависимости от exists
    const handleVerifyCode = async () => {
        if (smsCode.length !== 4) {
            Alert.alert('Ошибка', 'Введите 4-значный код');
            return;
        }
        setIsLoading(true);
        try {
            const res = await verifySmsCode(smsCode); // навигация происходит внутри
            if (!res?.success) {
                Alert.alert('Ошибка', res?.error || 'Неверный код');
                return;
            }
            // ничего не делаем: роут уже выполнен в verifySmsCode
        } catch {
            Alert.alert('Ошибка', 'Не удалось подтвердить код');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setStep('login');
        setPassword('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetStep('send-code');
        setLoginAttempts(0);
        setSmsCode('');
        setPhoneExists(null);
    };

    // ====== Сброс пароля ======

    const handleSendResetCode = async () => {
        const apiPhone = normalizePhone(phone);
        setIsLoading(true);
        try {
            const result = await sendPasswordResetCode(apiPhone);
            if (result.success) {
                setResetStep('verify-code');
                Alert.alert('Код отправлен', 'Код для сброса пароля отправлен на ваш номер');
            } else {
                Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
            }
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при отправке кода');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyResetCode = async () => {
        if (resetCode.length !== 4) {
            Alert.alert('Ошибка', 'Введите 4-значный код');
            return;
        }
        const apiPhone = normalizePhone(phone);
        setIsLoading(true);
        try {
            const result = await verifyPasswordResetCode(apiPhone, resetCode);
            if (result.success) setResetStep('new-password');
            else Alert.alert('Ошибка', result.error || 'Неверный код');
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при проверке кода');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) return Alert.alert('Ошибка', 'Пароль минимум 6 символов');
        if (newPassword !== confirmPassword) return Alert.alert('Ошибка', 'Пароли не совпадают');
        const apiPhone = normalizePhone(phone);
        setIsLoading(true);
        try {
            const result = await resetPassword(apiPhone, newPassword);
            if (result.success) {
                Alert.alert('Пароль изменен', 'Теперь вы можете войти с новым паролем.', [
                    {text: 'OK', onPress: handleBackToLogin}
                ]);
            } else {
                Alert.alert('Ошибка', result.error || 'Не удалось изменить пароль');
            }
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при изменении пароля');
        } finally {
            setIsLoading(false);
        }
    };

    // ====== Вход (для автомойки и т.п.) ======

    const handleLogin = async () => {
        if (!password.trim()) return Alert.alert('Ошибка', 'Введите пароль');
        if (!phone || phone.length < 18) return Alert.alert('Ошибка', 'Введите корректный номер телефона');

        const apiPhone = normalizePhone(phone);
        setIsLoading(true);
        try {
            const result = await loginWithPassword(apiPhone, password);
            if (result.success) {
                setLoginAttempts(0);
                Alert.alert('Успех', 'Добро пожаловать!');
            } else {
                const next = loginAttempts + 1;
                setLoginAttempts(next);
                if (next >= 3) {
                    Alert.alert('Неверный пароль', 'Хотите сбросить пароль?', [
                        {text: 'Отмена', style: 'cancel'},
                        {
                            text: 'Сбросить пароль', onPress: () => {
                                setStep('reset-password');
                                setResetStep('send-code');
                                setLoginAttempts(0);
                            }
                        }
                    ]);
                } else {
                    Alert.alert('Неверный пароль', `Осталось попыток: ${3 - next}`, [
                        {text: 'OK'},
                        {
                            text: 'Забыли пароль?', onPress: () => {
                                setStep('reset-password');
                                setResetStep('send-code');
                                setLoginAttempts(0);
                            }
                        }
                    ]);
                }
            }
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при входе');
        } finally {
            setIsLoading(false);
        }
    };

    // ====== Рендер шагов ======

    // Сброс пароля — шаги
    if (step === 'reset-password') {
        if (resetStep === 'send-code') {
            return (
                <SafeAreaView style={styles.container}>
                    <KeyboardAvoidingView style={styles.content}
                                          behavior={'height'}>

                        <View style={styles.header}>
                            <View style={styles.iconContainer}><Lock color="#fff" size={32}/></View>
                            <Text style={styles.title}>СБРОС ПАРОЛЯ</Text>
                            <Text style={styles.description}>Мы отправим код для сброса пароля{'\n'}на
                                номер {phone}</Text>
                        </View>
                        <View style={styles.form}>
                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleSendResetCode}
                                disabled={isLoading}
                            >
                                <Text style={styles.buttonText}>{isLoading ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ КОД'}</Text>
                                <ArrowRight color="#000000" size={20}/>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}
                                              disabled={isLoading}>
                                <Text style={styles.backButtonText}>Вернуться к входу</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                    <BackButton visible={showBack} onPress={goBackStep}/>
                </SafeAreaView>
            );
        }
        if (resetStep === 'verify-code') {
            return (
                <SafeAreaView style={styles.container}>
                    <KeyboardAvoidingView style={styles.content}
                                          behavior={'height'}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}><Lock color="#fff" size={32}/></View>
                            <Text style={styles.title}>ВВЕДИТЕ КОД</Text>
                            <Text style={styles.description}>Введите 4-значный код, отправленный{'\n'}на
                                номер {phone}</Text>
                        </View>
                        <View style={styles.form}>
                            <Text style={styles.label}>Код подтверждения</Text>
                            <TextInput
                                style={styles.input}
                                value={resetCode}
                                onChangeText={setResetCode}
                                placeholder="0000"
                                placeholderTextColor="#666666"
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                            <TouchableOpacity
                                style={[styles.button, (resetCode.length !== 4 || isLoading) && styles.buttonDisabled]}
                                onPress={handleVerifyResetCode}
                                disabled={resetCode.length !== 4 || isLoading}
                            >
                                <Text style={styles.buttonText}>{isLoading ? 'ПРОВЕРКА...' : 'ПОДТВЕРДИТЬ'}</Text>
                                <ArrowRight color="#000000" size={20}/>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.resendButton} onPress={handleSendResetCode}
                                              disabled={isLoading}>
                                <Text style={styles.resendButtonText}>Отправить код повторно</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}
                                              disabled={isLoading}>
                                <Text style={styles.backButtonText}>Вернуться к входу</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                    <BackButton visible={showBack} onPress={goBackStep}/>
                </SafeAreaView>
            );
        }
        if (resetStep === 'new-password') {
            return (
                <SafeAreaView style={styles.container}>
                    <KeyboardAvoidingView style={styles.content}
                                          behavior={'height'}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}><Lock color="#fff" size={32}/></View>
                            <Text style={styles.title}>НОВЫЙ ПАРОЛЬ</Text>
                            <Text style={styles.description}>Создайте новый пароль для входа{'\n'}в ваш
                                аккаунт</Text>
                        </View>
                        <View style={styles.form}>
                            <Text style={styles.label}>Новый пароль</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Минимум 6 символов"
                                placeholderTextColor="#666666"
                                secureTextEntry
                            />
                            <Text style={styles.label}>Подтвердите пароль</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Повторите пароль"
                                placeholderTextColor="#666666"
                                secureTextEntry
                            />
                            <TouchableOpacity
                                style={[styles.button, (newPassword.length < 6 || newPassword !== confirmPassword || isLoading) && styles.buttonDisabled]}
                                onPress={handleResetPassword}
                                disabled={newPassword.length < 6 || newPassword !== confirmPassword || isLoading}
                            >
                                <Text
                                    style={styles.buttonText}>{isLoading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ПАРОЛЬ'}</Text>
                                <ArrowRight color="#000000" size={20}/>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}
                                              disabled={isLoading}>
                                <Text style={styles.backButtonText}>Вернуться к входу</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                    <BackButton visible={showBack} onPress={goBackStep}/>
                </SafeAreaView>
            );
        }
    }

    // Экран выбора типа аккаунта
    if (step === 'choice') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}><User color="#14213D" size={56}/></View>
                        <Text style={styles.title}>Добро пожаловать!</Text>
                        <Text style={styles.subtitle}>Выберите тип аккаунта</Text>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => handleUserTypeChoice('car-owner')}
                                          disabled={isLoading}>
                            <Car color="#fff" size={24}/>
                            <Text style={styles.primaryButtonText}>Я ВЛАДЕЛЕЦ АВТО</Text>
                            <Text style={styles.buttonSubtext}>Хочу безлимитную мойку</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton}
                                          onPress={() => handleUserTypeChoice('car-wash')} disabled={isLoading}>
                            <Waves color="#14213D" size={24}/>
                            <Text style={styles.secondaryButtonText}>Я ВЛАДЕЛЕЦ АВТОМОЙКИ</Text>
                            <Text style={styles.buttonSubtext}>Хочу больше клиентов</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <BackButton visible={showBack} onPress={goBackStep}/>
            </SafeAreaView>
        );
    }

    // Экран ввода номера (регистрация владельца авто)
    if (step === 'registration') {
        return (
            <SafeAreaView style={styles.container}>
                <DismissKeyboard>
                    <KeyboardAvoidingView style={styles.content}
                                          behavior={'height'}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}><Phone color="#14213D" size={32}/></View>
                            <Text style={styles.title}>Водитель</Text>
                            <Text style={styles.description}>Введите номер телефона</Text>
                        </View>
                        <View style={styles.form}>
                            <Text style={styles.label}>Номер телефона</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={handlePhoneChange}
                                placeholder="+7 (___) ___-__-__"
                                placeholderTextColor="#666666"
                                keyboardType="phone-pad"
                                maxLength={18}
                            />
                            <TouchableOpacity
                                style={[styles.button, (!phone || phone.length < 18 || isLoading) && styles.buttonDisabled]}
                                onPress={handleRegistrationContinue}
                                disabled={!phone || phone.length < 18 || isLoading}
                            >
                                <Text
                                    style={styles.buttonText}>{isLoading ? 'ОТПРАВКА КОДА...' : 'ПРОДОЛЖИТЬ'}</Text>
                                <ArrowRight color="#fff" size={20}/>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Нажимая &quot;Продолжить&quot;, вы соглашаетесь{'\n'}
                                с условиями использования и политикой{'\n'}
                                конфиденциальности
                            </Text>
                        </View>
                    </KeyboardAvoidingView>
                </DismissKeyboard>
                <BackButton visible={showBack} onPress={goBackStep}/>
            </SafeAreaView>
        );
    }

    // Новый экран: ввод 4-значного кода для обычной аутентификации
    if (step === 'verify') {
        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView style={styles.content} behavior={'height'}>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}><Lock color="#14213D" size={32}/></View>
                        <Text style={styles.title}>ПОДТВЕРЖДЕНИЕ</Text>
                        <Text style={styles.description}>
                            Введите 4-значный код, отправленный{'\n'}
                            на номер {phone}
                        </Text>
                    </View>
                    <View style={styles.form}>
                        <Text style={styles.label}>Код из SMS</Text>
                        <TextInput
                            style={styles.input}
                            value={smsCode}
                            onChangeText={setSmsCode}
                            placeholder="0000"
                            placeholderTextColor="#666666"
                            keyboardType="number-pad"
                            maxLength={4}
                        />
                        <TouchableOpacity
                            style={[styles.button, (smsCode.length !== 4 || isLoading) && styles.buttonDisabled]}
                            onPress={handleVerifyCode}
                            disabled={smsCode.length !== 4 || isLoading}
                        >
                            <Text style={styles.buttonText}>{isLoading ? 'ПРОВЕРКА...' : 'ПОДТВЕРДИТЬ'}</Text>
                            <ArrowRight color="#fff" size={20}/>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.backButton, {marginTop: 12}]}
                            onPress={handleRegistrationContinue}
                            disabled={isLoading}
                        >
                            <Text style={styles.backButtonText}>Отправить код повторно</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}
                                          disabled={isLoading}>
                            <Text style={styles.backButtonText}>Изменить номер</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                <BackButton visible={showBack} onPress={goBackStep}/>
            </SafeAreaView>
        );
    }

    // Главный экран входа (для автомойки и т.п.)
    return (
        <SafeAreaView style={styles.container}>
            <DismissKeyboard>
                <KeyboardAvoidingView style={styles.content} behavior={'height'}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}><Lock color="#14213D" size={32}/></View>
                            <Text style={styles.title}>
                                {userType === 'car-wash' ? 'ВХОД ДЛЯ АВТОМОЙКИ' : 'ВХОД В АККАУНТ'}
                            </Text>
                            <Text style={styles.description}>
                                {userType === 'car-wash'
                                    ? 'Введите телефон и пароль владельца автомойки'
                                    : 'Введите номер телефона и пароль\nдля входа в аккаунт'}
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.label}>Номер телефона</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={handlePhoneChange}
                                placeholder="+7 (___) ___-__-__"
                                placeholderTextColor="#666666"
                                keyboardType="phone-pad"
                                maxLength={18}
                            />

                            <Text style={styles.label}>Пароль</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Введите ваш пароль"
                                placeholderTextColor="#666666"
                                secureTextEntry
                            />

                            <TouchableOpacity
                                style={[styles.button, (!password.trim() || !phone || phone.length < 18 || isLoading) && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={!password.trim() || !phone || phone.length < 18 || isLoading}
                            >
                                <Text style={styles.buttonText}>{isLoading ? 'ВХОД...' : 'ВОЙТИ'}</Text>
                                <ArrowRight color="#fff" size={20}/>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <View style={styles.loginFooter}>
                                <TouchableOpacity
                                    style={styles.forgotPasswordButton}
                                    onPress={() => {
                                        if (!phone || phone.length < 18) {
                                            Alert.alert('Ошибка', 'Сначала введите номер телефона');
                                            return;
                                        }
                                        setStep('reset-password');
                                        setResetStep('send-code');
                                    }}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </DismissKeyboard>
            <BackButton visible={showBack} onPress={goBackStep}/>
        </SafeAreaView>
    );
}
