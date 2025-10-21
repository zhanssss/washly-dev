import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // '#f8f9fa'
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text, // '#333'
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.disabledText, // '#666'
        textAlign: 'center',
        lineHeight: 22,
    },
    infoCard: {
        backgroundColor: colors.surface, // '#fff'
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: colors.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text, // '#333'
        marginTop: 12,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: colors.disabledText, // '#666'
        lineHeight: 20,
    },
    statsCard: {
        backgroundColor: colors.overlay, // '#e3f2fd'
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary, // '#1976d2'
        marginBottom: 8,
    },
    statsText: {
        fontSize: 14,
        color: colors.primary,
        lineHeight: 20,
    },
    createButton: {
        backgroundColor: colors.primary, // '#007AFF'
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: colors.success, // '#28a745'
    },
    buttonText: {
        color: colors.text, // '#fff'
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    successCard: {
        backgroundColor: colors.success, // '#d4edda'
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text, // '#155724'
        marginTop: 12,
        marginBottom: 8,
    },
    successText: {
        fontSize: 14,
        color: colors.text, // '#155724'
        textAlign: 'center',
        lineHeight: 20,
    },
    ownersList: {
        marginTop: 20,
    },
    ownersTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text, // '#333'
        marginBottom: 16,
    },
    ownerCard: {
        backgroundColor: colors.surface, // '#fff'
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: colors.background,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text, // '#333'
        marginBottom: 4,
    },
    ownerCarWash: {
        fontSize: 14,
        color: colors.primary, // '#007AFF'
        marginBottom: 2,
    },
    ownerPhone: {
        fontSize: 12,
        color: colors.disabledText, // '#666'
    },
});
