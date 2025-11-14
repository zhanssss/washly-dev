import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { styles } from './QrExtrasModal.style';

type Props = {
    visible: boolean;
    onClose: () => void;

    qrWashDetail: any;
    qrWashExtras: Array<{ id: number; name: string; price: number }>;
    selectedQrExtras: number[];

    paymentMethod: 'cash' | 'card';
    setPaymentMethod: (m: 'cash' | 'card') => void;

    isUpdatingExtras: boolean;
    isPaying: boolean;

    toggleQrExtra: (id: number) => void;
    handlePay: (method: 'cash' | 'card') => void;

    getBasePriceQR: () => number;
    getExtrasTotalQR: () => number;
    getServiceFee: (v: number) => number;
    getGrandTotalQR: () => number;

    pollInfo: any;
};

const QrExtrasModal: React.FC<Props> = ({
                                            visible,
                                            onClose,
                                            qrWashDetail,
                                            qrWashExtras,
                                            selectedQrExtras,
                                            paymentMethod,
                                            setPaymentMethod,
                                            isUpdatingExtras,
                                            isPaying,
                                            toggleQrExtra,
                                            handlePay,
                                            getBasePriceQR,
                                            getExtrasTotalQR,
                                            getServiceFee,
                                            getGrandTotalQR,
                                            pollInfo,
                                        }) => {

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.modalContainer}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>ПОДТВЕРЖДЕНИЕ ВИЗИТА</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Мойка */}
                    <View style={styles.washSection}>
                        <Text style={styles.washSectionTitle}>Ваша услуга</Text>

                        <View style={styles.washRow}>
                            <Image
                                source={{ uri: qrWashDetail?.image }}
                                style={styles.washImage}
                            />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.washInfoName}>
                                    {qrWashDetail?.name ?? 'Автомойка'}
                                </Text>
                                <Text style={styles.washInfoAddress} numberOfLines={2}>
                                    {qrWashDetail?.address ?? ''}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Допы */}
                    <View style={styles.extrasSection}>
                        <Text style={styles.washSectionTitle}>Дополнительные услуги</Text>

                        {qrWashExtras.length ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {qrWashExtras.map(ex => {
                                    const active = selectedQrExtras.includes(ex.id);
                                    return (
                                        <TouchableOpacity
                                            key={ex.id}
                                            disabled={isUpdatingExtras}
                                            onPress={() => toggleQrExtra(ex.id)}
                                            style={[
                                                styles.extraChip,
                                                active && styles.extraChipActive,
                                                isUpdatingExtras && { opacity: 0.7 }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.extraChipText,
                                                    active && styles.extraChipTextActive
                                                ]}
                                            >
                                                {ex.name}
                                            </Text>
                                            <Text style={{ textAlign: 'center' }}>
                                                · {ex.price.toLocaleString()} ₸
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={{ color: '#888' }}>Доп. услуги недоступны</Text>
                        )}
                    </View>

                    {/* Счёт */}
                    <View style={styles.receiptContainer}>
                        <Text style={styles.washSectionTitle}>Счёт</Text>

                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Цена мойки</Text>
                            <Text>{getBasePriceQR().toLocaleString()} ₸</Text>
                        </View>

                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Доп. услуги</Text>
                            <Text>{getExtrasTotalQR().toLocaleString()} ₸</Text>
                        </View>

                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Сервисный сбор</Text>
                            <Text>
                                {getServiceFee(getBasePriceQR() + getExtrasTotalQR()).toLocaleString()} ₸
                            </Text>
                        </View>

                        <View style={styles.receiptDivider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalText}>Итого</Text>
                            <Text style={styles.totalText}>
                                {getGrandTotalQR().toLocaleString()} ₸
                            </Text>
                        </View>
                    </View>

                    {/* Оплата */}
                    <View style={styles.paymentSection}>
                        <Text style={styles.washSectionTitle}>Оплата</Text>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {/* Cash */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('cash')}
                                style={[
                                    styles.paymentBtn,
                                    paymentMethod === 'cash' && styles.paymentBtnActive
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.paymentBtnText,
                                        paymentMethod === 'cash' && styles.paymentBtnTextActive
                                    ]}
                                >
                                    Наличные
                                </Text>
                            </TouchableOpacity>

                            {/* Card */}
                            <TouchableOpacity
                                onPress={() => {
                                    setPaymentMethod('card');
                                    Alert.alert('Скоро', 'Оплата картой пока недоступна.');
                                }}
                                style={[
                                    styles.paymentBtn,
                                    paymentMethod === 'card' && styles.paymentBtnActive
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.paymentBtnText,
                                        paymentMethod === 'card' && styles.paymentBtnTextActive
                                    ]}
                                >
                                    Карта (скоро)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* CTA */}
                    <View style={styles.cta}>
                        <TouchableOpacity
                            disabled={isPaying}
                            onPress={() => {
                                if (paymentMethod === 'card') {
                                    Alert.alert('Скоро', 'Оплата картой пока недоступна.');
                                    return;
                                }
                                handlePay('cash');
                            }}
                            style={[
                                styles.confirmBtn,
                                isPaying && { opacity: 0.6 }
                            ]}
                        >
                            <Text style={styles.confirmBtnText}>
                                {isPaying ? 'Обрабатываем…' : 'Подтвердить и начать'}
                            </Text>
                        </TouchableOpacity>

                        {pollInfo?.status === 'cash_waiting_approval' && (
                            <Text style={styles.waitingText}>
                                Ожидаем подтверждение кассира…
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default QrExtrasModal;
