import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import {router} from 'expo-router';
import {Phone, ArrowRight} from 'lucide-react-native';
import {useAuth} from '@/contexts/AuthContext';
import {styles} from './PhoneRegistration.styles'
import { SafeAreaView } from 'react-native-safe-area-context';

interface PhoneRegistrationProps {
    userType: 'car-owner' | 'car-wash';
}

export default function PhoneRegistration({userType}: PhoneRegistrationProps) {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const {sendVerificationCode} = useAuth();

    const formatPhone = (text: string) => {
        // Убираем все нецифровые символы
        const cleaned = text.replace(/\D/g, '');

        // Ограничиваем длину
        if (cleaned.length > 11) return phone;

        // Форматируем номер
        if (cleaned.length === 0) return '';
        if (cleaned.length <= 1) return `+7 (${cleaned}`;
        if (cleaned.length <= 4) return `+7 (${cleaned.slice(1)}`;
        if (cleaned.length <= 7) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
        if (cleaned.length <= 9) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    };

    const handlePhoneChange = (text: string) => {
        const formatted = formatPhone(text);
        setPhone(formatted);
    };

    const handleSendCode = async () => {
        if (phone.length < 18) {
            Alert.alert('Ошибка', 'Введите корректный номер телефона');
            return;
        }

        setIsLoading(true);
        try {
            // @ts-ignore
            const result = await sendVerificationCode(phone, userType);
            if (result.success) {
                router.push('/verification');
            } else {
                Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
            }
        } catch {
            Alert.alert('Ошибка', 'Произошла ошибка при отправке кода');
        } finally {
            setIsLoading(false);
        }
    };

    const userTypeText = userType === 'car-owner' ? 'ВЛАДЕЛЕЦ АВТО' : 'ВЛАДЕЛЕЦ АВТОМОЙКИ';
    const userTypeDescription = userType === 'car-owner'
        ? 'Безлимитная мойка в любой точке сети'
        : 'Привлекайте больше клиентов';

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Phone color="#FF6B35" size={32}/>
                    </View>
                    <Text style={styles.title}>РЕГИСТРАЦИЯ</Text>
                    <Text style={styles.userType}>{userTypeText}</Text>
                    <Text style={styles.description}>{userTypeDescription}</Text>
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
                        testID="phone-input"
                    />

                    <TouchableOpacity
                        style={[styles.button, (!phone || phone.length < 18 || isLoading) && styles.buttonDisabled]}
                        onPress={handleSendCode}
                        disabled={!phone || phone.length < 18 || isLoading}
                        testID="send-code-button"
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'ОТПРАВКА...' : 'ПОЛУЧИТЬ КОД'}
                        </Text>
                        <ArrowRight color="#000000" size={20}/>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Нажимая &quot;Получить код&quot;, вы соглашаетесь{'\n'}
                        с условиями использования и политикой{'\n'}
                        конфиденциальности
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}