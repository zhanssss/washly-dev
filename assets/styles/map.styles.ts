import {StyleSheet} from "react-native";
import {colors} from "@/assets/Theme/colors"; // ✅ централизованные цвета

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // '#000'
    },
    header: {
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border, // '#1A1A1A'
    },
    backBtn: {
        padding: 8,
        marginRight: 8
    },
    title: {
        color: colors.text, // '#fff'
        fontSize: 16,
        fontWeight: "700" as const,
        flex: 1,
        textAlign: "center"
    },
    mapWrap: {
        flex: 1,
    },
    pin: {
        backgroundColor: colors.primary,
        padding: 6,
        borderRadius: 16,
    },
    pinActive: {
        backgroundColor: colors.accent,
    },
    handle: {backgroundColor: '#ddd'},
    sheetBg: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    sheetHeader: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12},
    sheetTitle: {fontSize: 16, fontWeight: '700', color: colors.textDark},
    sheetSub: {marginTop: 2, color: colors.mutedText, fontSize: 12},

    card: {
        flexDirection: 'row',
        backgroundColor: '#fafafa',
        borderRadius: 14,
        padding: 10,
    },
    cardImage: {width: 64, height: 64, borderRadius: 10, marginRight: 10},
    cardTitle: {fontWeight: '700', color: colors.textDark},
    cardAddress: {color: colors.mutedText, fontSize: 12, marginTop: 2},
    row: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6},
    cardMeta: {color: colors.textDark},

    badge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
    badgeOpen: {backgroundColor: '#e8f7ed'},
    badgeClosed: {backgroundColor: '#fde8e8'},
    badgeText: {fontSize: 11, color: colors.textDark},

    bookingImage: {width: 72, height: 72, borderRadius: 12},
    bookingAddr: {color: colors.mutedText, fontSize: 12, marginTop: 2},
    bookingMeta: {marginLeft: 4, color: colors.textDark},

    sectionTitle: {fontWeight: '700', color: colors.textDark, marginBottom: 8},
    boxRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
    boxChip: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#f1f1f1'},
    boxChipActive: {backgroundColor: '#FFE9DF'},
    boxChipText: {color: colors.textDark},
    boxChipTextActive: {color: colors.accent, fontWeight: '700'},

    slot: {paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f1f1'},
    slotDisabled: {backgroundColor: '#ececec'},
    slotSelected: {backgroundColor: '#FFD1BC'},
    slotText: {color: colors.textDark, fontWeight: '600'},
    slotTextDisabled: {color: '#999'},
    slotTextSelected: {color: '#000'},

    cta: {
        marginTop: 14,
        backgroundColor: colors.accent,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    ctaDisabled: {backgroundColor: '#ffd7c7'},
    ctaText: {color: colors.textDark, fontWeight: '800'},
    ctaTextDisabled: {color: '#555'},

    muted: {color: colors.mutedText},
    // --- каталог автомоек ---
    listItem: {
        backgroundColor: '#fff',
        padding: 14,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
        elevation: 2,
    },
    listName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textDark,
    },
    listAddress: {
        fontSize: 12,
        color: colors.mutedText,
        marginTop: 2,
    },

    // --- панель бронирования ---
// --- модалка брони ---
    bookingModal: {
        flex: 1,
        backgroundColor: '#fff',
    },
    bookingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    bookingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textDark,
    },
    bookingCloseButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 20,
        color: colors.textDark,
    },
    bookingContent: {
        flex: 1,
        padding: 16,
    },
    bookingCarWashInfo: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    bookingCarWashImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 12,
    },
    bookingCarWashDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    bookingCarWashName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textDark,
    },
    bookingCarWashMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 12,
    },
    bookingRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bookingRatingText: {
        color: colors.textDark,
        fontSize: 13,
    },
    bookingLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bookingLocationText: {
        fontSize: 12,
        color: colors.mutedText,
    },
    bookingWorkingHours: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    bookingWorkingHoursText: {
        fontSize: 12,
        color: colors.textDark,
    },

// --- слоты ---
    slotsSection: {
        marginVertical: 16,
    },
    slotsSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textDark,
    },
    slotsSectionSubtitle: {
        fontSize: 12,
        color: colors.mutedText,
        marginTop: 2,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    slotCard: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
    },
    slotCardDisabled: {
        backgroundColor: '#ececec',
    },
    slotCardSelected: {
        backgroundColor: '#FFD1BC',
    },
    slotTime: {
        fontWeight: '600',
        color: colors.textDark,
    },
    slotTimeDisabled: {
        color: '#aaa',
    },
    slotTimeSelected: {
        color: '#000',
    },
    slotUnavailableBadge: {
        marginTop: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
        backgroundColor: '#ddd',
        alignSelf: 'flex-start',
    },
    slotUnavailableText: {
        fontSize: 10,
        color: '#555',
    },

// --- услуги ---
    servicesSection: {
        marginVertical: 20,
    },
    servicesSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textDark,
    },
    servicesSectionSubtitle: {
        fontSize: 12,
        color: colors.mutedText,
        marginTop: 2,
        marginBottom: 8,
    },
    serviceCategorySection: {
        marginTop: 12,
    },
    serviceCategoryTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        color: colors.textDark,
    },
    serviceItem: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
    },
    serviceItemSelected: {
        borderWidth: 2,
        borderColor: colors.accent,
        backgroundColor: '#FFE9DF',
    },
    serviceMainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    serviceHeader: {
        flexDirection: 'row',
        gap: 8,
    },
    serviceInfo: {
        flexShrink: 1,
    },
    serviceText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textDark,
    },
    serviceTextSelected: {
        color: colors.accent,
    },
    serviceDescription: {
        fontSize: 12,
        color: colors.mutedText,
    },
    servicePriceContainer: {},
    servicePrice: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textDark,
    },
    servicePriceSelected: {
        color: colors.accent,
    },
    serviceCheckbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderRadius: 4,
        borderColor: '#aaa',
        marginTop: 8,
    },
    serviceCheckboxSelected: {
        borderColor: colors.accent,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceCheckboxInner: {
        width: 10,
        height: 10,
        backgroundColor: '#fff',
    },

// --- итого ---
    totalPriceSection: {
        marginTop: 16,
        marginBottom: 32,
    },
    totalPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalPriceLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textDark,
    },
    totalPriceValue: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.accent,
    },
    totalPriceSubtext: {
        marginTop: 4,
        fontSize: 12,
        color: colors.mutedText,
    },

// --- действия ---
    bookingActions: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: 16,
    },
    confirmBookingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.accent,
        gap: 8,
    },
    confirmBookingButtonDisabled: {
        backgroundColor: '#ffd7c7',
    },
    confirmBookingButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    confirmBookingButtonTextDisabled: {
        color: '#666',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },

    searchInput: {
        flex: 1,
        backgroundColor: '#f1f1f1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        color: '#000',
    },

    filterBtn: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#f1f1f1',
    },
    filterBtnActive: {
        backgroundColor: '#FF6B35',
    },

    chipsRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 8,
        gap: 8,
        width: '100%',
    },

    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.primary,
        color: '#fff',
        width: '48%',
    },
    chipActive: {
        backgroundColor: '#FF6B35',
    },

    chipText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
    chipTextActive: {
        color: '#fff',
    },

});
