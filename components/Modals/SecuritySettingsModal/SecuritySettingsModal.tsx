// components/Dashboards/CarWashDashboard/Modals/SecuritySettingsModal.tsx
import React from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Phone, Settings, X } from 'lucide-react-native';
import { styles } from '@/components/Dashboards/CarWashDashboard/CarWashDashboard.styles';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const SecuritySettingsModal: React.FC<Props> = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>БЕЗОПАСНОСТЬ</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color="#14213D" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.settingsSection}>
                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Alert.alert(
                                    'Смена пароля',
                                    'Функция будет доступна в следующем обновлении',
                                );
                            }}
                        >
                            <Shield color="#14213D" size={20} />
                            <Text style={styles.settingsItemText}>Сменить пароль</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Alert.alert(
                                    'Двухфакторная аутентификация',
                                    'Функция будет доступна в следующем обновлении',
                                );
                            }}
                        >
                            <Phone color="#14213D" size={20} />
                            <Text style={styles.settingsItemText}>
                                Двухфакторная аутентификация
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Alert.alert(
                                    'Активные сессии',
                                    'У вас 1 активная сессия на этом устройстве',
                                );
                            }}
                        >
                            <Settings color="#14213D" size={20} />
                            <Text style={styles.settingsItemText}>Активные сессии</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Alert.alert(
                                    'Резервное копирование',
                                    'Данные автоматически сохраняются в облаке',
                                );
                            }}
                        >
                            <Settings color="#14213D" size={20} />
                            <Text style={styles.settingsItemText}>
                                Резервное копирование
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

export default SecuritySettingsModal;
