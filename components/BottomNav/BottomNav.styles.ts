import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
        zIndex: 50,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 48,
        minWidth: 72,
    },
    label: {
        fontSize: 11,
        color: colors.primary,
    },
    labelActive: {
        color: colors.accent,
        fontWeight: '600',
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 40,
        paddingHorizontal: 18,
        borderRadius: 20,
        backgroundColor: colors.accent,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
    },
    ctaText: {
        color: colors.textDark,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
