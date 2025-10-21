import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.card,
    },
    title: {
        flex: 1, textAlign: 'center',
        fontSize: 18, fontWeight: '900',
        color: colors.text,
    },
    scroll: { flex: 1 },
    empty: { alignItems: 'center', marginTop: 32, paddingHorizontal: 16 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
    emptySubtitle: { fontSize: 13, color: colors.mutedText },
    list: { paddingHorizontal: 16, paddingTop: 8 },

    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timeText: { fontSize: 13, fontWeight: '700', color: colors.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    statusConfirmed: { backgroundColor: '#d1fae5' },
    statusWaiting:   { backgroundColor: '#fef9c3' },
    statusCanceled:  { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 11, fontWeight: '700', color: colors.textDark },

    washName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    address: { fontSize: 12, color: colors.mutedText, flexShrink: 1 },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    chip: {
        backgroundColor: '#f3f4f6',
        color: colors.textDark,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 999, fontSize: 12,
    },

    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price: { fontSize: 16, fontWeight: '900', color: colors.text },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    cancelBtn: { backgroundColor: '#fca5a5' },
    actionText: { fontSize: 12, fontWeight: '800', color: colors.textDark },
    sectionDivider: {
        height: 1,
        backgroundColor: '#E5E7EB', // или твой colors.border
        marginVertical: 12,
    },
    callBtn: {
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
