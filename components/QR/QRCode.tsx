import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';

type QRCodeProps = {
    value: string;
    size?: number;
    backgroundColor?: string; // цвет фона внутри кода
    foregroundColor?: string; // цвет "модулей" (квадратиков)
};

export default function QRCode({
                                   value,
                                   size = 200,
                                   backgroundColor = '#FFFFFF',
                                   foregroundColor = '#000000',
                               }: QRCodeProps) {
    // Белая "тихая зона" вокруг кода для лучшего сканирования
    return (
        <View style={styles.wrapper}>
            <QRCodeSVG
                value={value || ''}     // сюда прилетает твой qr_url (например, "washly://qr/<token>")
                size={size}
                color={foregroundColor}
                backgroundColor={backgroundColor}
                ecl="M"                 // уровень коррекции ошибок
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        padding: 12,              // quiet zone
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
