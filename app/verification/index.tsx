import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {Shield, ArrowRight} from 'lucide-react-native';
import {useAuth} from '@/contexts/AuthContext';
import {styles} from '@/assets/styles/verification.styles';

export default function VerificationScreen() {
    const [code, setCode] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const {verifyCode, pendingPhone, currentVerificationCode} = useAuth();
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const insets = useSafeAreaInsets();
    useEffect(() => {
        if (!pendingPhone) {
            router.replace('/');
        }
    }, [pendingPhone]);
    const handleCodeChange = (text: string, index: number) => {
        if (text.length > 1) return;

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
            const result = await verifyCode(codeToVerify);

            if (!result.success) {
                Alert.alert('Ошибка', result.error || 'Неверный код');
                setCode(['', '', '', '']);
                inputRefs.current[0]?.focus();
                return;
            }

            // навигация происходит внутри verifyCode
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при верификации');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Shield color="#FF6B35" size={32}/>
                        </View>
                        <Text style={styles.title}>ВЕРИФИКАЦИЯ</Text>
                        <Text style={styles.description}>
                            Введите 4-значный код,{'\n'}
                            отправленный на номер{'\n'}
                            <Text style={styles.phone}>{pendingPhone}</Text>
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
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    textAlign="center"
                                    testID={`code-input-${index}`}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.button, (code.some(digit => !digit) || isLoading) && styles.buttonDisabled]}
                            onPress={() => handleVerify()}
                            disabled={code.some(digit => !digit) || isLoading}
                            testID="verify-button"
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'ПРОВЕРКА...' : 'ПОДТВЕРДИТЬ'}
                            </Text>
                            <ArrowRight color="#000000" size={20}/>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.backText}>Изменить номер телефона</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}
