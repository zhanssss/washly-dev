import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 12,
    },

    header: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontWeight: '800',
        fontSize: 16,
        color: colors.textDark,
    },
    closeBtn: {
        padding: 6,
    },

    content: {
        padding: 16,
        paddingBottom: 40,
    },

    avatarWrap: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarButton: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 12,
        right: 20,
        backgroundColor: colors.accent,
        borderRadius: 16,
        padding: 6,
    },
    avatarHint: {
        marginTop: 8,
        color: colors.mutedText,
        fontSize: 12,
    },

    label: {
        fontSize: 12,
        color: colors.mutedText,
        marginBottom: 12,
    },

    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    inputLast: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },

    bodyWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    chipActive: {
        borderColor: colors.accent,
        backgroundColor: '#FFF1ED',
    },
    chipText: {
        color: colors.textDark,
    },
    chipTextActive: {
        color: colors.accent,
    },

    loader: {
        paddingVertical: 12,
        alignItems: 'center',
    },

    actions: {
        marginTop:36,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: colors.accent,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#14213D',
        fontWeight: '800',
    },
    secondaryButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: colors.textDark,
        fontWeight: '700',
    },

    // небольшие утилки
    spacer12: { height: 12 },

    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        rowGap: 12,
        marginBottom: 16,
    },
    colorDotWrap: {
        width: 68,
        alignItems: 'center',
    },
    colorDotWrapActive: {
        transform: [{ scale: 1.04 }],
    },
    colorDotActive: {
        borderColor: colors.primary,
        borderWidth: 1,
        transform: [{ scale: 1.04 }],
    },
    colorDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // тень для iOS/Android
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        marginBottom: 6,
    },
    colorName: {
        fontSize: 12,
        color: '#4B5563',
        maxWidth: 68,
        textAlign: 'center',
    },
});
