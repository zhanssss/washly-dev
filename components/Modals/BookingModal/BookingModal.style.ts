import {StyleSheet} from 'react-native';
import {colors} from '@/assets/Theme/colors';

export const styles = StyleSheet.create({

    bookingCarWashMeta: {gap: 6, marginBottom: 8},
    bookingRating: {flexDirection: 'row', alignItems: 'center', gap: 4},
    bookingRatingText: {fontSize: 14, color: colors.text, fontWeight: '600' as const},
    bookingLocation: {flexDirection: 'row', alignItems: 'center', gap: 4},
    bookingLocationText: {fontSize: 12, color: colors.mutedText, flex: 1},
    bookingWorkingHours: {flexDirection: 'row', alignItems: 'center', gap: 6},
    bookingWorkingHoursText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600' as const,

    },

    serviceText: {fontSize: 16, color: colors.text, fontWeight: '600' as const, marginBottom: 4},
    serviceTextSelected: {color: colors.primary},

    closeButtonText: {fontSize: 18, color: colors.primary},

    slotsSection: {marginBottom: 32},
    slotsSectionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 8,
        letterSpacing: 1
    },
    slotsSectionSubtitle: {
        fontSize: 14,
        color: colors.mutedText,
        marginBottom: 20
    },

    serviceItem: {
        backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12,
        marginBottom: 12, borderWidth: 2, borderColor: colors.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginHorizontal: 1
    },
    serviceItemSelected: {borderColor: colors.primary, backgroundColor: colors.surfaceSelected},


    bookingModal: {flex: 1, backgroundColor: colors.background},
    bookingHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    bookingTitle: {fontSize: 20, fontWeight: '800' as const, color: colors.text, letterSpacing: 1},
    bookingCloseButton: {padding: 8},
    bookingContent: {
        flex: 1,
    },
    bookingHero: {
        width: '100%',
        height: 220,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#000',
        position: 'relative',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },

    bookingHeroImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    bookingBody: {
        paddingHorizontal: 24,
    },

    bookingCloseOnHero: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },

    bookingHeroOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.35)', // лёгкое затемнение
    },

    bookingHeroContent: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },

    bookingHeroName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },

    bookingHeroRatingText: {
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: 4,
    },

    bookingHeroLocationText: {
        fontSize: 13,
        color: '#FFFFFFCC',
        marginLeft: 4,
    },

    bookingHeroHoursText: {
        fontSize: 13,
        color: '#FFFFFF',
        marginLeft: 6,
    },
    slotsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
    slotCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        width: '30%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#14213D',
        position: 'relative',
    },
    slotCardDisabled: {
        backgroundColor: colors.surfaceMuted,
        opacity: 0.6,
    },
    slotCardSelected: {borderColor: colors.primary, backgroundColor: colors.surfaceSelected},

    slotTime: {

        fontSize: 16,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 4,

    },
    slotTimeDisabled: {color: colors.disabledText},
    slotTimeSelected: {color: colors.primary},

    slotPrice: {fontSize: 12, color: colors.mutedText, fontWeight: '600' as const},
    slotPriceDisabled: {color: colors.grayMedium},
    slotPriceSelected: {color: colors.text},

    slotUnavailableBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: colors.danger,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4
    },
    slotUnavailableText: {fontSize: 8, fontWeight: '700' as const, color: colors.textWhite, letterSpacing: 0.5},
    servicesSectionSubtitle: {fontSize: 12, color: colors.mutedText, marginBottom: 20, lineHeight: 16},

    serviceCategorySection: {marginBottom: 24},
    serviceCategoryTitle: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: colors.primary,
        marginBottom: 12,
        letterSpacing: 1
    },


    serviceMainInfo: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    serviceHeader: {flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12},
    serviceIcon: {fontSize: 24},
    serviceInfo: {flex: 1},
    servicePriceContainer: {alignItems: 'flex-end', marginLeft: 12},

    serviceCheckbox: {
        width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.grayMedium,
        alignItems: 'center', justifyContent: 'center', marginLeft: 12,
    },
    serviceCheckboxSelected: {borderColor: colors.primary, backgroundColor: colors.primary},
    serviceCheckboxInner: {width: 12, height: 12, borderRadius: 3, backgroundColor: colors.textWhite},


    serviceDescription: {fontSize: 12, color: colors.mutedText, marginBottom: 4, lineHeight: 16},
    serviceDuration: {fontSize: 11, color: colors.disabledText, fontStyle: 'italic' as const},
    servicePrice: {fontSize: 18, fontWeight: '800' as const, color: colors.text},
    servicePriceSelected: {color: colors.primary},
    servicesSection: {marginBottom: 32},
    servicesSectionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 8,
        letterSpacing: 1
    },
    servicesContainer: {marginTop: 8},
    servicesTitle: {fontSize: 14, fontWeight: '600' as const, color: colors.text, marginBottom: 8},
    servicesList: {gap: 4},

    totalPriceSection: {backgroundColor: colors.surfaceSelected, borderRadius: 12, padding: 16, marginTop: 16},
    totalPriceContainer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4},
    totalPriceLabel: {fontSize: 16, fontWeight: '700' as const, color: colors.textDark, letterSpacing: 1},
    totalPriceValue: {fontSize: 24, fontWeight: '900' as const, color: colors.textDark},
    totalPriceSubtext: {fontSize: 12, color: colors.textDark, opacity: 0.8},
    confirmBookingButton: {
        backgroundColor: colors.accent,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 24, borderRadius: 12, gap: 8,
    },
    confirmBookingButtonDisabled: {backgroundColor: colors.mutedGray},
    confirmBookingButtonText: {fontSize: 14, fontWeight: '800' as const, color: colors.textDark, letterSpacing: 1},
    confirmBookingButtonTextDisabled: {color: colors.disabledText},
    bookingActions:{

    },
})