import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, router, type Href } from 'expo-router';
import { Home, QrCode, Calendar, BarChart3 } from 'lucide-react-native';
import { colors } from '@/assets/Theme/colors';
import { styles } from './BottomNav.styles';

type Props = {
    onOpenQR?: () => void; // чтобы из экрана карты открыть твой QR-сканер/модалку
};

export default function BottomNav({ onOpenQR }: Props) {
    const insets = useSafeAreaInsets();
    const path = usePathname();
    const isActive = (href: string) => path === href;
    const go = (href: Href) => router.push(href);
    return (
        <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={styles.row}>
                <TouchableOpacity style={styles.item} onPress={() => go('/map' as Href)}>
                    <Home size={20} color={isActive('/map') ? colors.accent : colors.primary}/>
                    <Text style={[styles.label, isActive('/map') && styles.labelActive]}>Главная</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={() => go('/my-bookings' as Href)}>
                    <Calendar size={20} color={isActive('/my-bookings') ? colors.accent : colors.primary}/>
                    <Text style={[styles.label, isActive('/my-bookings') && styles.labelActive]}>Мои записи</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={() => router.push({ pathname: '/map', params: { openQR: '1' } })}
                >
                    <QrCode size={20} color={colors.textDark}/>
                    <Text style={styles.label}>QR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={() => go('/stats' as Href)}>
                    <BarChart3 size={20} color={isActive('/stats') ? colors.accent : colors.primary}/>
                    <Text style={[styles.label, isActive('/stats') && styles.labelActive]}>Статистика</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
