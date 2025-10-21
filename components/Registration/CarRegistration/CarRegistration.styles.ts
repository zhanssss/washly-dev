import {StyleSheet} from 'react-native';
import {colors} from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
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
        fontSize: 28,
        fontWeight: '900' as const,
        color: colors.text,
        letterSpacing: 1.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: colors.mutedText,
        textAlign: 'center',
    },
    form: {
        gap: 24,
        marginBottom: 40,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: colors.text,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 20,
    },
    inputIcon: {
        marginRight: 12,
    },
    inputWithIcon: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 18,
        color: colors.text,
    },
    inputError: {
        borderColor: colors.primary,
    },
    errorText: {
        fontSize: 12,
        color: colors.primary,
        marginTop: 4,
    },
    picker: {
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerDisabled: {
        backgroundColor: colors.background,
        borderColor: colors.grayDark,
    },
    pickerText: {
        fontSize: 18,
        color: colors.text,
    },
    placeholderText: {
        color: colors.grayMedium,
    },
    pickerOptions: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,

        backgroundColor: colors.card,
        borderRadius: 12,
        marginTop: 6,
        maxHeight: 240,
        borderWidth: 1,
        borderColor: colors.border,

        // поверх всего
        zIndex: 1000,
        elevation: 6,                  // Android
        shadowColor: '#000',           // iOS тень
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: 4},
    },

    selectWrapper: {
        position: 'relative',
    },

    searchablePickerContainer: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    pickerList: {
        maxHeight: 180,
    },
    pickerOption: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    pickerOptionText: {
        fontSize: 16,
        color: colors.text,
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
        marginBottom: 30,
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
    pickerSheet: {
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    pickerListContent: {
        paddingVertical: 6,
    },
});
