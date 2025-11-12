import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, api } from '@/contexts/AuthContext';
import { useMyBookings } from '@/src/data/bookings/useMyBookings';
import { router } from 'expo-router';
import {
    User, Bell, Crown, Edit, HelpCircle, LogOut, Trash2, Calendar, Target, Trophy, Settings,
} from 'lucide-react-native';
import { colors } from '@/assets/Theme/colors';
import { styles } from './OwnerHeader.styles'; // вынесите стили сюда из CarOwnerDashboard.styles
import EditProfileModal from '@/components/Profile/EditProfileModal/EditProfileModal';
type Notification = {
    id: string; title: string; message: string;
    type: 'reminder' | 'booking' | 'promo'; timestamp: Date; read: boolean;
};

export default function OwnerHeader() {
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const { reload } = useMyBookings();

    // локальные состояния (скопированы из дашборда)
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showNotificationsSettings, setShowNotificationsSettings] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [nextSheet, setNextSheet] = useState<null | 'editProfile'>(null);
    // мок уведомлений как у вас
    useEffect(() => {
        setNotifications([
            { id: '1', title: '🔥 ПОРА МЫТЬСЯ!', message: 'Прошло 7 дней с последней мойки.', type: 'reminder', timestamp: new Date(), read: false },
            { id: '2', title: '⏰ Напоминание о записи', message: 'Через 20 минут ваша запись.', type: 'booking', timestamp: new Date(), read: false },
            { id: '3', title: '🎯 СКИДКА', message: 'Сегодня -50% на детейлинг', type: 'promo', timestamp: new Date(), read: true },
        ]);
    }, []);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const markNotificationAsRead = (id: string) =>
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    const markAllNotificationsAsRead = () =>
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const handleDeleteAccount = () => {
        Alert.alert(
            'Удалить аккаунт',
            'Это действие необратимо. Продолжить?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setShowProfile(false);
                            await api.delete('/privacy/delete-my-user/');
                            Alert.alert('Готово', 'Аккаунт удалён');
                            logout();
                        } catch (e: any) {
                            Alert.alert('Ошибка', e?.message ?? 'Не удалось удалить аккаунт');
                        }
                    },
                },
            ],
        );
    };

    return (
        <>
            {/* HEADER ROW */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.profileIcon} onPress={() => setShowProfile(true)}>
                    <User color={colors.accent} size={20} />
                </TouchableOpacity>

                <View style={styles.userInfoContainer}>
                    <View style={styles.userBasicInfo}>
                        <Text style={styles.greeting}>
                            {user?.username || user?.name || user?.carDetails?.ownerName || 'Пользователь'}
                        </Text>
                    </View>
                    {user?.carDetails && (
                        <View style={styles.carInfoInHeader}>
                            <Text style={styles.carInfoText}>{user.carDetails.licensePlate}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.headerRight}>
                    {/*<TouchableOpacity style={styles.subscriptionHeaderButton} onPress={() => router.push('/subscription')}>*/}
                    {/*    <Crown color={colors.accent} size={16} />*/}
                    {/*    <Text style={styles.subscriptionHeaderText}>ПРЕМИУМ</Text>*/}
                    {/*</TouchableOpacity>*/}

                    <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.notificationButton}>
                        <Bell color={colors.accent} size={20} />
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationCount}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* PROFILE MODAL */}
            <Modal
                visible={showProfile}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowProfile(false)}
                onDismiss={() => {
                    if (nextSheet === 'editProfile') {
                        setNextSheet(null);
                        setShowEditProfile(true);
                    }
                }}
            >
                <View style={[styles.profileModal, { paddingTop: insets.top }]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>ПРОФИЛЬ</Text>
                        <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.profileCloseButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.profileUserCard}>
                            <User color="#FF6B35" size={32} />
                            <View style={styles.profileUserInfo}>
                                <Text style={styles.profileUserName}>
                                    {user?.username || user?.name || user?.carDetails?.ownerName || 'Пользователь'}
                                </Text>
                                <Text style={styles.profileUserPhone}>{user?.phone}</Text>
                                {/*<View style={styles.profileStatusBadge}>*/}
                                {/*    <Crown color="#FFD700" size={12} />*/}
                                {/*    <Text style={styles.profileStatusText}>VIP КЛИЕНТ</Text>*/}
                                {/*</View>*/}
                            </View>
                        </View>

                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsSectionTitle}>НАСТРОЙКИ</Text>

                            <TouchableOpacity
                                style={styles.settingsItem}
                                onPress={() => {
                                    setShowProfile(false);
                                    setNextSheet('editProfile');
                                }}
                            >
                                <Edit color="#FF6B35" size={20} />
                                <Text style={styles.settingsItemText}>Редактировать профиль</Text>
                            </TouchableOpacity>

                            {/*<TouchableOpacity style={styles.settingsItem} onPress={() => { setShowProfile(false); router.push('/subscription'); }}>*/}
                            {/*    <Crown color="#FF6B35" size={20} />*/}
                            {/*    <Text style={styles.settingsItemText}>Подписка</Text>*/}
                            {/*</TouchableOpacity>*/}

                            <TouchableOpacity style={styles.settingsItem} onPress={() => { setShowProfile(false); setShowNotificationsSettings(true); }}>
                                <Bell color="#FF6B35" size={20} />
                                <Text style={styles.settingsItemText}>Уведомления</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.settingsItem} onPress={() => { setShowProfile(false); setShowHelpModal(true); }}>
                                <HelpCircle color="#FF6B35" size={20} />
                                <Text style={styles.settingsItemText}>Помощь</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.logoutSection}>
                            <TouchableOpacity style={styles.profileLogoutButton} onPress={() => { setShowProfile(false); logout(); }}>
                                <LogOut color="#FF0000" size={20} />
                                <Text style={styles.profileLogoutText}>Выйти из аккаунта</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.profileLogoutButton, { borderColor: '#FF3B30' }]} onPress={handleDeleteAccount}>
                                <Trash2 color="#FF3B30" size={20} />
                                <Text style={[styles.profileLogoutText, { color: '#FF3B30' }]}>Удалить аккаунт</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* NOTIFICATIONS MODAL */}
            <Modal
                visible={showNotifications}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={[styles.profileModal, { paddingTop: insets.top }]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>УВЕДОМЛЕНИЯ</Text>
                        <View style={styles.notificationHeaderActions}>
                            <TouchableOpacity onPress={markAllNotificationsAsRead} style={styles.markAllReadButton}>
                                <Text style={styles.markAllReadText}>Прочитать все</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.profileCloseButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.profileContent}>
                        {notifications.length === 0 ? (
                            <View style={styles.emptyNotifications}>
                                <Bell color="#888888" size={48} />
                                <Text style={styles.emptyNotificationsText}>Нет уведомлений</Text>
                            </View>
                        ) : (
                            <View style={styles.notificationsList}>
                                {notifications.map(n => (
                                    <TouchableOpacity
                                        key={n.id}
                                        style={[styles.notificationItem, !n.read && styles.notificationItemUnread]}
                                        onPress={() => markNotificationAsRead(n.id)}
                                    >
                                        <View style={styles.notificationIcon}>
                                            {n.type === 'reminder' && <Target color="#FF6B35" size={20} />}
                                            {n.type === 'booking' && <Calendar color="#FF6B35" size={20} />}
                                            {n.type === 'promo' && <Trophy color="#FF6B35" size={20} />}
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text style={[styles.notificationTitle, !n.read && styles.notificationTitleUnread]}>{n.title}</Text>
                                            <Text style={styles.notificationMessage}>{n.message}</Text>
                                            <Text style={styles.notificationTime}>
                                                {n.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        {!n.read && <View style={styles.notificationUnreadDot} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* NOTIFICATIONS SETTINGS */}
            <Modal
                visible={showNotificationsSettings}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNotificationsSettings(false)}
            >
                <View style={[styles.profileModal, { paddingTop: insets.top }]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>УВЕДОМЛЕНИЯ</Text>
                        <TouchableOpacity onPress={() => setShowNotificationsSettings(false)} style={styles.profileCloseButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.profileContent}>
                        <View style={styles.settingsSection}>
                            {/* заглушки тумблеров как у вас */}
                            <TouchableOpacity style={styles.settingsToggleItem}>
                                <View style={styles.settingsToggleInfo}>
                                    <Bell color="#FF6B35" size={20} />
                                    <View style={styles.settingsToggleText}>
                                        <Text style={styles.settingsItemText}>Push-уведомления</Text>
                                        <Text style={styles.settingsItemSubtext}>Получать уведомления о записях</Text>
                                    </View>
                                </View>
                                <View style={styles.toggleSwitch}><View style={styles.toggleActive} /></View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingsToggleItem}>
                                <View style={styles.settingsToggleInfo}>
                                    <Target color="#FF6B35" size={20} />
                                    <View style={styles.settingsToggleText}>
                                        <Text style={styles.settingsItemText}>Напоминания о мойке</Text>
                                        <Text style={styles.settingsItemSubtext}>Умные напоминания каждые 7 дней</Text>
                                    </View>
                                </View>
                                <View style={styles.toggleSwitch}><View style={styles.toggleActive} /></View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingsToggleItem}>
                                <View style={styles.settingsToggleInfo}>
                                    <Trophy color="#FF6B35" size={20} />
                                    <View style={styles.settingsToggleText}>
                                        <Text style={styles.settingsItemText}>Акции и скидки</Text>
                                        <Text style={styles.settingsItemSubtext}>Специальные предложения</Text>
                                    </View>
                                </View>
                                <View style={styles.toggleSwitch}><View style={styles.toggleInactive} /></View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            <EditProfileModal
                visible={showEditProfile}
                onClose={() => setShowEditProfile(false)}
            />

            {/* HELP */}
            <Modal
                visible={showHelpModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowHelpModal(false)}
            >
                <View style={[styles.profileModal, { paddingTop: insets.top }]}>
                    <View style={styles.profileHeader}>
                        <Text style={styles.profileTitle}>ПОМОЩЬ</Text>
                        <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.profileCloseButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.profileContent}>
                        {/* Q&A кратко — как у вас */}
                        <View style={styles.helpSection}>
                            <Text style={styles.helpSectionTitle}>ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ</Text>
                            <View style={styles.helpItem}>
                                <Text style={styles.helpQuestion}>Как работает подписка?</Text>
                                <Text style={styles.helpAnswer}>Подписка даёт доступ к мойкам у партнёров…</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
}
