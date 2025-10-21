import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, Camera } from 'lucide-react-native';
import { styles } from './QRScanner.styles';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
    isVisible: boolean;
}

export default function QRScanner({ onScan, onClose, isVisible }: QRScannerProps) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    // 🔒 моментальный замок от дублей (не зависит от перерендера)
    const scanLockRef = useRef(false);
    // (опционально) анти-спам по одному и тому же коду за короткий интервал
    const lastDataRef = useRef<string | null>(null);
    const lastAtRef = useRef(0);
    const MIN_INTERVAL_MS = 1500;

    useEffect(() => {
        if (isVisible) {
            setScanned(false);
            scanLockRef.current = false;
            lastDataRef.current = null;
            lastAtRef.current = 0;
        }
    }, [isVisible]);

    if (!isVisible) return null;

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Загрузка камеры...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Camera color="#FF6B35" size={48} />
                    <Text style={styles.message}>Нужно разрешение для использования камеры</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>РАЗРЕШИТЬ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        // 🔒 моментально блокируем повторные срабатывания
        if (scanLockRef.current) return;

        // ⏱️ отсечь частые дубликаты того же кода
        const now = Date.now();
        if (data === lastDataRef.current && now - lastAtRef.current < MIN_INTERVAL_MS) return;
        lastDataRef.current = data;
        lastAtRef.current = now;

        scanLockRef.current = true; // блок до закрытия или ручного сброса
        setScanned(true);           // отключим распознавание на уровне настроек (см. ниже)
        onScan(data);
    };

    const toggleCameraFacing = () => {
        setFacing(cur => (cur === 'back' ? 'front' : 'back'));
    };

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <View style={styles.webFallback}>
                    <Camera color="#FF6B35" size={48} />
                    <Text style={styles.webFallbackText}>Сканирование QR-кода доступно только на мобильных устройствах</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>ЗАКРЫТЬ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                // ✅ держим хендлер всегда, но внутри есть замок
                onBarcodeScanned={handleBarCodeScanned}
                // ✅ после первого скана отключаем распознавание полностью
                barcodeScannerSettings={{
                    barcodeTypes: scanned ? [] : ['qr'],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                            <X color="#FFFFFF" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Сканировать QR-код</Text>
                        <TouchableOpacity style={styles.headerButton} onPress={toggleCameraFacing}>
                            <Camera color="#FFFFFF" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.scanArea}>
                        <View style={styles.scanFrame}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                    </View>

                    <View style={styles.instructions}>
                        <Text style={styles.instructionText}>Наведите камеру на QR-код автомойки</Text>

                        {scanned && (
                            <TouchableOpacity
                                style={styles.scanAgainButton}
                                onPress={() => {
                                    // 🔓 разрешаем новое сканирование только вручную
                                    scanLockRef.current = false;
                                    setScanned(false);
                                    lastDataRef.current = null;
                                    lastAtRef.current = 0;
                                }}
                            >
                                <Text style={styles.scanAgainText}>СКАНИРОВАТЬ СНОВА</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </CameraView>
        </View>
    );
}
