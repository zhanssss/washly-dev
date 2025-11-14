// components/Filters/FiltersModal.styles.ts
import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textDark,
    },
    closeButton: {
        padding: 6,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textDark,
        marginTop: 20,
        marginBottom: 10,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: colors.surfaceSelected,
    },
    optionButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.accent,
    },
    optionText: {
        marginLeft: 6,
        fontSize: 14,
        color: colors.textDark,
    },
    optionTextActive: {
        color: colors.accent,
        fontWeight: '600',
    },
    priceInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: colors.textDark,
    },
    priceDash: {
        marginHorizontal: 8,
        fontSize: 16,
        color: colors.mutedText,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        marginBottom: 40,
    },
    resetButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.accent,
        borderRadius: 16,
        paddingVertical: 12,
        marginRight: 8,
        alignItems: 'center',
    },
    resetText: {
        color: colors.accent,
        fontWeight: '600',
    },
    applyButton: {
        flex: 1,
        backgroundColor: colors.accent,
        borderRadius: 16,
        paddingVertical: 12,
        marginLeft: 8,
        alignItems: 'center',
    },
    applyText: {
        color: colors.textWhite,
        fontWeight: '600',
    },
});
