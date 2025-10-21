import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Database, CheckCircle } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import {styles} from '../../assets/styles/test-accounts.styles'

export default function TestAccountsScreen() {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isCreated, setIsCreated] = useState<boolean>(false);

  const createAccountsMutation = trpc.auth.createTestAccounts.useMutation({
    onSuccess: (data) => {
      console.log('✅ Тестовые аккаунты созданы:', data);
      setIsCreated(true);
    },
    onError: (error) => {
      console.error('❌ Ошибка создания аккаунтов:', error);
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });

  const testUsersQuery = trpc.auth.getAllTestUsers.useQuery();

  const handleCreateAccounts = () => {
    setIsCreating(true);
    createAccountsMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Database size={48} color="#007AFF" />
          <Text style={styles.title}>Тестовые аккаунты</Text>
          <Text style={styles.subtitle}>
            Создайте тестовые аккаунты владельцев автомоек для демонстрации функционала бронирования
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Users size={24} color="#28a745" />
          <Text style={styles.infoTitle}>Что будет создано:</Text>
          <Text style={styles.infoText}>
            • 6 тестовых аккаунтов владельцев автомоек{'\n'}
            • Привязка к существующим автомойкам{'\n'}
            • Возможность реального бронирования{'\n'}
            • Система управления слотами времени
          </Text>
        </View>

        {testUsersQuery.data && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Статистика:</Text>
            <Text style={styles.statsText}>
              Пользователей: {testUsersQuery.data.totalUsers}{'\n'}
              Бронирований: {testUsersQuery.data.totalBookings}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            (isCreating || isCreated) && styles.disabledButton
          ]}
          onPress={handleCreateAccounts}
          disabled={isCreating || isCreated}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isCreated ? (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.buttonText}>Аккаунты созданы</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Создать тестовые аккаунты</Text>
          )}
        </TouchableOpacity>

        {isCreated && (
          <View style={styles.successCard}>
            <CheckCircle size={32} color="#28a745" />
            <Text style={styles.successTitle}>Готово!</Text>
            <Text style={styles.successText}>
              Тестовые аккаунты владельцев автомоек созданы. Теперь вы можете:
              {'\n\n'}
              • Записываться на мойку в любой автомойке{'\n'}
              • Выбирать доступные временные слоты{'\n'}
              • Видеть реальные цены по типу кузова{'\n'}
              • Получать подтверждения бронирования
            </Text>
          </View>
        )}

        <View style={styles.ownersList}>
          <Text style={styles.ownersTitle}>Владельцы автомоек:</Text>
          {[
            { name: 'Алексей Петров', carWash: 'WASH PREMIUM', phone: '+77771234567' },
            { name: 'Марина Иванова', carWash: 'AUTO SPA DELUXE', phone: '+77771234568' },
            { name: 'Дмитрий Сидоров', carWash: 'CLEAN MASTER', phone: '+77771234569' },
            { name: 'Анна Козлова', carWash: 'AQUA WASH', phone: '+77771234570' },
            { name: 'Сергей Волков', carWash: 'SHINE CAR', phone: '+77771234571' },
            { name: 'Елена Морозова', carWash: 'CRYSTAL WASH', phone: '+77771234572' },
          ].map((owner, index) => (
            <View key={index} style={styles.ownerCard}>
              <Text style={styles.ownerName}>{owner.name}</Text>
              <Text style={styles.ownerCarWash}>{owner.carWash}</Text>
              <Text style={styles.ownerPhone}>{owner.phone}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

