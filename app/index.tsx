// app/index/index.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView  } from "react-native-safe-area-context";

import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreen from '@/components/AuthScreen/AuthScreen';
import CarWashRegistration from '@/components/Registration/CarWashRegistration/CarWashRegistration';
import {styles} from '@/assets/styles/index.styles'

export default function WelcomeScreen() {
  const { user, isLoading, needsCarDetails, needsCarWashDetails, authStep } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (needsCarDetails) {
        // Пользователь прошел верификацию, но нужно заполнить данные об авто
        router.replace('/car-registration');
        return;
      }
      
      if (needsCarWashDetails) {
        // Пользователь прошел верификацию, но нужно заполнить данные об автомойке
        // Показываем форму регистрации автомойки прямо здесь
        return;
      }
      
      if (user && authStep === 'complete') {
        // Полностью зарегистрированный пользователь
        if (user.type === 'car-owner') {
          router.replace('/car-owner');
        } else if (user.type === 'car-wash') {
          router.replace('/car-wash');
        }
      }
    }
  }, [user, isLoading, needsCarDetails, needsCarWashDetails, authStep]);

  // Always call hooks in the same order - render conditionally based on state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Показываем форму регистрации автомойки если нужно
  if (needsCarWashDetails) {
    return <CarWashRegistration />;
  }

  // Показываем экран аутентификации если пользователь не авторизован
  if (!user || authStep !== 'complete') {
    return <AuthScreen />;
  }

  // Этот код не должен выполняться, но оставляем для безопасности
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { justifyContent: 'center' }]}>
        <Text style={styles.loadingText}>Перенаправление...</Text>
      </View>
    </SafeAreaView>
  );
}

