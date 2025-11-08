import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { styles } from '@/assets/styles/index.styles';
import AuthScreen from "@/components/AuthScreen/AuthScreen";

export default function Index() {
    const { user, isLoading, needsCarDetails, needsCarWashDetails } = useAuth();

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.content, { justifyContent: 'center' }]}>
                    <Text style={styles.loadingText}>Загрузка...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (needsCarDetails) {
        return <Redirect href="/car-registration" />;
    }

    if (user) {
        return user.type === 'car-owner'
            ? <Redirect href="/map" />
            : <Redirect href="/car-wash" />;
    }

    // 5) Не авторизован → на стек авторизации
    return <AuthScreen/>;
}
