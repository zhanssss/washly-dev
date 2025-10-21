import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '900' as const,
        color: colors.text,
        letterSpacing: 2,
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        color: colors.mutedText,
        textAlign: 'center',
        lineHeight: 22,
    },
    phone: {
        color: colors.primary,
        fontWeight: '600' as const,
    },
    form: {
        gap: 32,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    codeInput: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 20,
        fontSize: 24,
        fontWeight: '700' as const,
        color: colors.text,
        borderWidth: 2,
        borderColor: colors.border,
    },
    codeInputFilled: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    buttonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '800' as const,
        color: colors.background,
        letterSpacing: 1,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    backText: {
        fontSize: 14,
        color: colors.primary,
        textDecorationLine: 'underline',
    },
    codeDisplay: {
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    codeDisplayLabel: {
        fontSize: 12,
        color: colors.mutedText,
        marginBottom: 4,
    },
    codeDisplayText: {
        fontSize: 20,
        fontWeight: '700' as const,
        color: colors.primary,
        textAlign: 'center',
        letterSpacing: 4,
    },
    autoFillButton: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginTop: 12,
    },
    autoFillButtonText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: colors.background,
        textAlign: 'center',
    },
});
