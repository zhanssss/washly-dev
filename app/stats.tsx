import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Star, Clock, MapPin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useVisits } from '@/contexts/VisitsContext';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';
import OwnerHeader from '@/components/OwnerHeader/OwnerHeader';
import { colors } from '@/assets/Theme/colors';
import { styles } from '@/assets/styles/stats.styles';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';


export default function StatsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { getUserStats } = useVisits();

    // если нужно подтягивать что-то по свайпу вниз — вставьте нужные функции
    const refreshFn = async () => {};
    const { refreshing, onRefresh } = usePullToRefresh([refreshFn]);

    const userStats = getUserStats(user?.id || 'default');

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 64 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                <View style={styles.section}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <ArrowLeft color={colors.accent} size={18} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Моя статистика</Text>
                        <View style={{ width: 36 }} />
                    </View>

                    <View style={styles.grid}>
                        <View style={styles.card}>
                            <BarChart3 color={colors.accent} size={24} />
                            <Text style={styles.number}>{userStats.totalVisits}</Text>
                            <Text style={styles.label}>Всего визитов</Text>
                        </View>

                        <View style={styles.card}>
                            <Star color={colors.accent} size={24} />
                            <Text style={styles.number}>{userStats.subscriptionVisits}</Text>
                            <Text style={styles.label}>По подписке</Text>
                        </View>

                        <View style={styles.card}>
                            <Clock color={colors.accent} size={24} />
                            <Text style={styles.number}>{userStats.monthlyVisits}</Text>
                            <Text style={styles.label}>В этом месяце</Text>
                        </View>

                        <View style={styles.card}>
                            <MapPin color={colors.accent} size={24} />
                            <Text style={styles.number}>{userStats.regularVisits}</Text>
                            <Text style={styles.label}>Обычные мойки</Text>
                        </View>
                    </View>

                    <View style={styles.favorite}>
                        <Text style={styles.favoriteTitle}>ЛЮБИМАЯ АВТОМОЙКА</Text>
                        <View style={styles.favoriteCard}>
                            <MapPin color={colors.accent} size={20} />
                            <Text style={styles.favoriteText}>{userStats.favoriteCarWash}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
