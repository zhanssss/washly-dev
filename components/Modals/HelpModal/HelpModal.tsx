// components/Dashboards/CarWashDashboard/Modals/HelpModal.tsx
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
import { Phone, Settings, X } from 'lucide-react-native';
import { styles } from '@/components/Dashboards/CarWashDashboard/CarWashDashboard.styles';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const HelpModal: React.FC<Props> = ({ visible, onClose }) => {
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
                    <Text style={styles.modalTitle}>ПОМОЩЬ</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color="#14213D" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.helpSection}>
                        <Text style={styles.helpSectionTitle}>РУКОВОДСТВО ДЛЯ ВЛАДЕЛЬЦЕВ</Text>

                        <View style={styles.helpItem}>
                            <Text style={styles.helpQuestion}>Как настроить QR-код?</Text>
                            <Text style={styles.helpAnswer}>
                                Перейдите на вкладку QR-КОД, распечатайте код и разместите его в
                                каждом боксе. Клиенты смогут сканировать его для подтверждения
                                визитов.
                            </Text>
                        </View>

                        <View style={styles.helpItem}>
                            <Text style={styles.helpQuestion}>Как отслеживать загруженность?</Text>
                            <Text style={styles.helpAnswer}>
                                Используйте вкладку ЗАПИСИ для мониторинга загруженности по
                                часам и управления записями клиентов.
                            </Text>
                        </View>

                        <View style={styles.helpItem}>
                            <Text style={styles.helpQuestion}>Как работает система оплаты?</Text>
                            <Text style={styles.helpAnswer}>
                                Клиенты с подпиской могут мыться бесплатно. Обычные клиенты
                                оплачивают через приложение или наличными.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.contactSection}>
                        <Text style={styles.contactSectionTitle}>ПОДДЕРЖКА БИЗНЕСА</Text>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => Alert.alert('Телефон', '+7 (777) 123-45-67')}
                        >
                            <Phone color="#14213D" size={20} />
                            <Text style={styles.contactText}>Линия поддержки бизнеса</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => Alert.alert('Email', 'business@carwash.kz')}
                        >
                            <Settings color="#14213D" size={20} />
                            <Text style={styles.contactText}>Техническая поддержка</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

export default HelpModal;
