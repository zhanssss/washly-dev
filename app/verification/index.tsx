import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {ArrowRight, Shield} from 'lucide-react-native';
import {useAuth} from '@/contexts/AuthContext';
import {styles} from '@/assets/styles/verification.styles';
import {formatKzPhone} from '@/src/stores/authStore';

export default function VerificationScreen() {
    const [code, setCode] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const {
        verifyCode,
        verifyPasswordResetCode,
        resetPassword,
        pendingPhone,
        currentVerificationCode,
        verificationPurpose,
    } = useAuth();

    const [resetStep, setResetStep] = useState<'code' | 'new-password'>('code');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    const inputRefs = useRef<(TextInput | null)[]>([]);
    const insets = useSafeAreaInsets();
    useEffect(() => {
        if (!pendingPhone) {
            router.replace('/');
        }
    }, [pendingPhone]);

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (verificationCode?: string) => {
        const codeToVerify = verificationCode || code.join('');

        if (codeToVerify.length !== 4) {
            Alert.alert('Ошибка', 'Введите 4-значный код');
            return;
        }

        setIsLoading(true);
        try {
            if (verificationPurpose === 'reset-password') {
                // 👉 сценарий "забыли пароль"
                if (!pendingPhone) {
                    Alert.alert('Ошибка', 'Неизвестен номер телефона для сброса');
                    return;
                }

                const res = await verifyPasswordResetCode(pendingPhone, codeToVerify);
                if (res.success) {
                    // reset_token сохранён в контексте, теперь спрашиваем новый пароль
                    setResetStep('new-password');
                } else {
                    Alert.alert('Ошибка', res.error || 'Неверный код');
                    setCode(['', '', '', '']);
                    inputRefs.current[0]?.focus();
                }
            } else {
                // 👉 обычная OTP-верификация (регистрация/логин)
                const result = await verifyCode(codeToVerify);

                if (result.success) {
                    if (!result.isRegistered) {
                        if (result.user?.role === 'client') {
                            router.replace('/car-registration');
                        } else {
                            router.replace('/');
                        }
                    } else {
                        router.replace('/');
                    }
                } else {
                    Alert.alert('Ошибка', result.error || 'Неверный код');
                    setCode(['', '', '', '']);
                    inputRefs.current[0]?.focus();
                }
            }
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при верификации');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert('Ошибка', 'Пароль минимум 6 символов');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Ошибка', 'Пароли не совпадают');
            return;
        }

        setIsLoading(true);
        try {
            const res = await resetPassword('', newPassword);
            if (res.success) {
                Alert.alert(
                    'Готово',
                    res.message || 'Пароль сброшен. Войдите с новым паролем.',
                    [{ text: 'OK', onPress: () => router.replace('/') }],
                );
            } else {
                Alert.alert('Ошибка', res.error || 'Не удалось изменить пароль');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formattedPhone = pendingPhone ? formatKzPhone(pendingPhone) : '';

    const handleCodeChange = (text: string, index: number) => {
        // Если в ПЕРВЫЙ инпут вставили сразу весь код (кнопка "из SMS")
        if (index === 0 && text.length > 1) {
            const digits = text.replace(/\D/g, '').slice(0, 4);
            const arr = digits.split('');

            const filled: string[] = [
                arr[0] || '',
                arr[1] || '',
                arr[2] || '',
                arr[3] || '',
            ];

            setCode(filled);

            if (filled.every(d => d)) {
                handleVerify(filled.join(''));
            } else {
                const nextIndex = Math.min(digits.length, 3);
                inputRefs.current[nextIndex]?.focus();
            }
            return;
        }

        // На всякий случай: если куда-то ещё прилетело несколько символов — берём последнюю цифру
        if (text.length > 1) {
            text = text.slice(-1);
        }

        // Обычный ввод по одной цифре
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        if (text && index === 3 && newCode.every(digit => digit)) {
            handleVerify(newCode.join(''));
        }
    };

    if (verificationPurpose === 'reset-password' && resetStep === 'new-password') {
        // 👉 Экран "НОВЫЙ ПАРОЛЬ"
        return (
            <KeyboardAvoidingView
                style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Shield color="#14213D" size={32} />
                            </View>
                            <Text style={styles.title}>НОВЫЙ ПАРОЛЬ</Text>
                            <Text style={styles.description}>
                                Создайте новый пароль для входа{'\n'}в ваш аккаунт
                            </Text>
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
                                style={[
                                    styles.button,
                                    (newPassword.length < 6 ||
                                        newPassword !== confirmPassword ||
                                        isLoading) && styles.buttonDisabled,
                                ]}
                                onPress={handleResetPassword}
                                disabled={
                                    newPassword.length < 6 ||
                                    newPassword !== confirmPassword ||
                                    isLoading
                                }
                            >
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ПАРОЛЬ'}
                                </Text>
                                <ArrowRight color="#fff" size={20} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.replace('/')}>
                                <Text style={styles.backText}>Вернуться к входу</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        );
    }


    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top + 16}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Shield color="#14213D" size={32}/>
                            </View>
                            <Text style={styles.title}>ВЕРИФИКАЦИЯ</Text>
                            <Text style={styles.description}>
                                Введите 4-значный код,{'\n'}
                                отправленный на номер{'\n'}
                                <Text style={styles.phone}>{formattedPhone}</Text>
                            </Text>

                            {currentVerificationCode && (
                                <View style={styles.codeDisplay}>
                                    <Text style={styles.codeDisplayLabel}>Код для автозаполнения:</Text>
                                    <Text style={styles.codeDisplayText}>{currentVerificationCode}</Text>
                                    <TouchableOpacity
                                        style={styles.autoFillButton}
                                        onPress={() => {
                                            const codeArray = currentVerificationCode.split('');
                                            setCode(codeArray);
                                            setTimeout(() => {
                                                handleVerify(currentVerificationCode);
                                            }, 100);
                                        }}
                                        testID="auto-fill-button"
                                    >
                                        <Text style={styles.autoFillButtonText}>АВТОЗАПОЛНЕНИЕ</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={styles.form}>
                            <View style={styles.codeContainer}>
                                {code.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => {
                                            inputRefs.current[index] = ref;
                                        }}
                                        style={[
                                            styles.codeInput,
                                            digit && styles.codeInputFilled,
                                        ]}
                                        value={digit}
                                        onChangeText={(text) => handleCodeChange(text, index)}
                                        onKeyPress={({nativeEvent}) => handleKeyPress(nativeEvent.key, index)}
                                        textAlign="center"
                                        testID={`code-input-${index}`}
                                        keyboardType="number-pad"
                                        maxLength={index === 0 ? 4 : 1}
                                        {...(index === 0
                                            ? {
                                                textContentType: 'oneTimeCode' as const,
                                                autoComplete: 'sms-otp' as const,
                                                importantForAutofill: 'yes' as const,
                                            }
                                            : {})}
                                    />
                                ))}

                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.backText}>Изменить номер телефона</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
