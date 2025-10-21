import { StyleSheet } from "react-native";
import { colors } from "@/assets/Theme/colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.overlay, // rgba(255,255,255,0.2)
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    backButtonText: {
        color: colors.text,
        fontSize: 20,
        fontWeight: "bold",
    },
    headerContent: {
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: colors.textMuted, // rgba(255,255,255,0.9)
        textAlign: "center",
    },
    valueSection: {
        padding: 20,
        backgroundColor: colors.surface, // #111111
    },
    valueTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 20,
        textAlign: "center",
    },
    benefitsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    benefitItem: {
        width: "48%",
        backgroundColor: colors.card, // #1a1a1a
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 15,
    },
    benefitTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: colors.text,
        marginTop: 8,
        marginBottom: 4,
    },
    benefitText: {
        fontSize: 12,
        color: colors.mutedText, // #999
        textAlign: "center",
    },
    urgencySection: {
        backgroundColor: colors.accent, // #FF5722
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    urgencyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 8,
        textAlign: "center",
    },
    urgencyText: {
        fontSize: 14,
        color: colors.text,
        textAlign: "center",
        lineHeight: 20,
    },
    plansSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 20,
        textAlign: "center",
    },
    planCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 20,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "transparent",
    },
    selectedPlan: {
        borderColor: colors.success, // #4CAF50
    },
    popularPlan: {
        borderColor: colors.warning, // #FF9800
    },
    popularBadge: {
        position: "absolute",
        top: 15,
        right: 15,
        backgroundColor: colors.warning,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 1,
    },
    popularText: {
        color: colors.text,
        fontSize: 10,
        fontWeight: "bold",
    },
    premiumBadge: {
        position: "absolute",
        top: 15,
        right: 15,
        backgroundColor: colors.premium, // #9C27B0
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 1,
    },
    premiumText: {
        color: colors.text,
        fontSize: 10,
        fontWeight: "bold",
        marginLeft: 4,
    },
    planHeader: {
        padding: 20,
        alignItems: "center",
    },
    planName: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        marginTop: 8,
    },
    planBody: {
        padding: 20,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        marginBottom: 10,
    },
    originalPrice: {
        fontSize: 16,
        color: colors.mutedText,
        textDecorationLine: "line-through",
        marginRight: 8,
    },
    price: {
        fontSize: 32,
        fontWeight: "bold",
        color: colors.text,
    },
    period: {
        fontSize: 16,
        color: colors.mutedText,
        marginLeft: 4,
    },
    savingsContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    savings: {
        backgroundColor: colors.success,
        color: colors.text,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: "bold",
    },
    featuresContainer: {
        marginTop: 10,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    featureIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    featureText: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
    },
    disabledFeature: {
        color: colors.disabledText, // #666
    },
    testimonialsSection: {
        padding: 20,
        backgroundColor: colors.surface,
    },
    testimonialCard: {
        backgroundColor: colors.card,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    testimonialHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    testimonialName: {
        fontSize: 14,
        fontWeight: "bold",
        color: colors.text,
    },
    rating: {
        flexDirection: "row",
    },
    testimonialText: {
        fontSize: 14,
        color: colors.secondaryText, // #ccc
        lineHeight: 20,
    },
    guaranteeSection: {
        backgroundColor: colors.card,
        margin: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
    },
    guaranteeTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        marginTop: 10,
        marginBottom: 8,
    },
    guaranteeText: {
        fontSize: 14,
        color: colors.secondaryText,
        textAlign: "center",
        lineHeight: 20,
    },
    ctaSection: {
        padding: 20,
        paddingBottom: 40,
    },
    ctaButton: {
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
    },
    ctaGradient: {
        paddingVertical: 16,
        alignItems: "center",
    },
    ctaText: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
    },
    ctaSubtext: {
        fontSize: 12,
        color: colors.mutedText,
        textAlign: "center",
    },
});
