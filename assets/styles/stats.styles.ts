import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1, paddingHorizontal: 16 },
    section: { paddingTop: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        width: '47%',
        borderWidth: 1, borderColor: '#eee', borderRadius: 12,
        paddingVertical: 14, alignItems: 'center', gap: 6,
        backgroundColor: '#fff',
    },
    number: { fontSize: 18, fontWeight: '800', color: colors.textDark },
    label: { fontSize: 12, color: colors.mutedText },

    favorite: { marginTop: 20 },
    favoriteTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 8 },
    favoriteCard: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12,
    },
    favoriteText: { fontSize: 14, color: colors.textDark, fontWeight: '600' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textDark,
    },
});
