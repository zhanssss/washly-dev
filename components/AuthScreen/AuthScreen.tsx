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
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

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
            style={styles.backFab}
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
    const keyboardOffset = Platform.OS === 'ios' ? insets.top : 0;

    // шаг verify УБРАЛИ — теперь верификация живёт на отдельной странице
    const [step, setStep] = useState<'login' | 'choice' | 'reset-password' | 'registration'>('choice');

    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetStep, setResetStep] = useState<'send-code' | 'verify-code' | 'new-password'>('send-code');
    const [loginAttempts, setLoginAttempts] = useState(0);

    // флаг про существование номера пока не используем, можно удалить если не нужен
    const [phoneExists, setPhoneExists] = useState<boolean | null>(null);

    const {
        sendVerificationCode,
        // verifyCode здесь больше не нужен — верификация на отдельном экране
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
        if (isLoading) return true;

        // verify-экрана внутри больше нет
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

        return false;
    }, [step, resetStep, isLoading]);

    React.useEffect(() => {
        if (Platform.OS !== 'android') return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            const handled = goBackStep();
            return true;
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
                if (phone) saveTempPhone(normalizePhone(phone));
                setStep('registration');
            } else {
                setUserType('car-wash');
                setStep('login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Регистрация (ввод телефона) → отправка SMS → ПЕРЕХОД НА /verification
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
            // сохраняем номер в контекст (pendingPhone уже ставится внутри sendVerificationCode)
            saveTempPhone(apiPhone);
            // идём на экран верификации кода
            router.push('/verification');
        } catch {
            Alert.alert('Ошибка', 'Не удалось отправить код. Попробуйте позже.');
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
        setPhoneExists(null);
    };

    // ====== Сброс пароля (без изменений) ======

    const handleSendResetCode = async () => {
        const apiPhone = normalizePhone(phone);
        setIsLoading(true);
        try {
            const res = await sendPasswordResetCode(apiPhone);
            if (res.success) {
                setResetStep('verify-code');
                Alert.alert('Код отправлен', res.message || 'Проверьте SMS');
            } else {
                Alert.alert('Ошибка', res.error || 'Не удалось отправить код');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyResetCode = async () => {
        if (resetCode.length !== 4) return Alert.alert('Ошибка', 'Введите 4-значный код');
        const apiPhone = normalizePhone(phone);
        setIsLoading(true);
        try {
            const res = await verifyPasswordResetCode(apiPhone, resetCode);
            if (res.success) {
                setResetStep('new-password');
            } else {
                Alert.alert('Ошибка', res.error || 'Неверный код');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) return Alert.alert('Ошибка', 'Пароль минимум 6 символов');
        if (newPassword !== confirmPassword) return Alert.alert('Ошибка', 'Пароли не совпадают');

        setIsLoading(true);
        try {
            const res = await resetPassword('', newPassword);
            if (res.success) {
                Alert.alert('Готово', res.message || 'Пароль сброшен. Войдите с новым паролем.', [
                    {text: 'OK', onPress: handleBackToLogin}
                ]);
            } else {
                Alert.alert('Ошибка', res.error || 'Не удалось изменить пароль');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ====== Вход (автомойка) ======

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
                }
            }
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при входе');
        } finally {
            setIsLoading(false);
        }
    };

    // ====== Рендер шагов ======

    // Сброс пароля — шаги (оставил как было)
    if (step === 'reset-password') {
        if (resetStep === 'send-code') {
            return (
                <SafeAreaView style={styles.container}>
                    <DismissKeyboard>
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
                                    <ArrowRight color="#fff" size={20}/>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.footer}>
                                <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}
                                                  disabled={isLoading}>
                                    <Text style={styles.backButtonText}>Вернуться к входу</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </DismissKeyboard>
                    <BackButton visible={showBack} onPress={goBackStep}/>
                </SafeAreaView>
            );
        }
        if (resetStep === 'verify-code') {
            return (
                <SafeAreaView style={styles.container}>
                    <DismissKeyboard>
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
                    </DismissKeyboard>
                    <BackButton visible={showBack} onPress={goBackStep}/>
                </SafeAreaView>
            );
        }
        if (resetStep === 'new-password') {
            return (
                <SafeAreaView style={styles.container}>
                    <DismissKeyboard>
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
                    </DismissKeyboard>
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
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => handleUserTypeChoice('car-owner')}
                            disabled={isLoading}
                        >
                            <Car color="#fff" size={24}/>
                            <Text style={styles.primaryButtonText}>Я ВЛАДЕЛЕЦ АВТО</Text>
                            <Text style={styles.buttonSubtext}>Хочу безлимитную мойку</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => handleUserTypeChoice('car-wash')}
                            disabled={isLoading}
                        >
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

    // Главный экран входа
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
