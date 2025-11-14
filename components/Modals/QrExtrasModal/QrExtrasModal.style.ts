// QrExtrasModal.styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        zIndex: 9999,
    },

    modalContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: "85%",
    },

    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
    },

    closeBtnText: {
        fontSize: 20,
    },

    scroll: {
        padding: 16,
    },

    washSection: {
        marginBottom: 16,
    },

    washSectionTitle: {
        fontWeight: "700",
        marginBottom: 8,
    },

    washRow: {
        flexDirection: "row",
        gap: 12,
    },

    washImage: {
        width: 72,
        height: 72,
        borderRadius: 8,
        backgroundColor: "#eee",
    },

    washInfoName: {
        fontSize: 16,
        fontWeight: "600",
    },

    washInfoAddress: {
        color: "#666",
    },

    extrasSection: {
        marginBottom: 16,
    },

    extraChip: {
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },

    extraChipActive: {
        borderColor: "#FF6B35",
        backgroundColor: "rgba(255,107,53,0.1)",
    },

    extraChipText: {
        fontWeight: "600",
        color: "#111",
    },

    extraChipTextActive: {
        color: "#FF6B35",
    },

    receiptContainer: {
        padding: 12,
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 12,
        marginBottom: 16,
    },

    receiptRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },

    receiptLabel: {
        color: "#555",
    },

    receiptDivider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 6,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    totalText: {
        fontWeight: "800",
    },

    paymentSection: {
        marginBottom: 16,
    },

    paymentBtn: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
        alignItems: "center",
    },

    paymentBtnActive: {
        borderColor: "#FF6B35",
        backgroundColor: "rgba(255,107,53,0.1)",
    },

    paymentBtnText: {
        fontWeight: "700",
        color: "#111",
    },

    paymentBtnTextActive: {
        color: "#FF6B35",
    },

    cta: {
        marginBottom: 24,
    },

    confirmBtn: {
        backgroundColor: "#FF6B35",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    confirmBtnText: {
        color: "#111",
        fontWeight: "800",
    },

    waitingText: {
        textAlign: "center",
        marginTop: 8,
        color: "#666",
    },
});
