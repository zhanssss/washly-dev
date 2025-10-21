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
        marginBottom: 8,
    },
    userType: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: colors.primary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: colors.mutedText,
        textAlign: 'center',
    },
    form: {
        gap: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 18,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
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
    footerText: {
        fontSize: 12,
        color: colors.disabledText,
        textAlign: 'center',
        lineHeight: 16,
    },
});
