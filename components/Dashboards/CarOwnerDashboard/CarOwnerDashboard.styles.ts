// CarOwnerDashboard.styles.ts
import {StyleSheet} from 'react-native';
import {colors} from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.background},

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    greeting: {fontSize: 16, fontWeight: '600' as const, color: colors.text},
    phone: {fontSize: 12, color: colors.mutedText, marginTop: 1},
    logoutButton: {padding: 8},

    mapContainer: {
        height: 280,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },

    mapTabContainer: {flex: 1},
    scrollableContent: {flex: 1},
    scrollableContentContainer: {paddingBottom: 120},
    map: {flex: 1},

    listContainer: {paddingVertical: 16},
    listTitle: {fontSize: 20, fontWeight: '700' as const, color: colors.text},
    scrollContent: {paddingHorizontal: 16, gap: 16},
    listHeader: {
        flexDirection: 'column',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 6,
    },

    listSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.mutedText,
    },


    carWashCard: {
        width: 280,
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: .2,
        borderColor: colors.primary,
        position: 'relative',
    },
    selectedCard: {borderColor: colors.primary},

    carWashImage: {
        width: '100%',
        height: 120,
        borderBottomWidth: 1,
        borderColor: colors.primary,

    },
    cardContent: {padding: 16},

    carWashName: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 8,
    },

    ratingContainer: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8},
    rating: {fontSize: 14, color: colors.text, fontWeight: '600' as const},
    address: {fontSize: 12, color: colors.mutedText, marginBottom: 12},

    priceContainer: {flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8},
    price: {fontSize: 18, fontWeight: '800' as const, color: colors.primary},
    priceLabel: {fontSize: 12, color: colors.mutedText},

    detailsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,             // прижимаем к низу
        maxHeight: '65%',      // шторка по экрану
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 16,     // базовый отступ
        paddingHorizontal: 16,
        zIndex: 50,            // поверх навбара
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailsTitle: {fontSize: 20, fontWeight: '700' as const, color: colors.text},
    closeButton: {fontSize: 20, color: colors.mutedText, padding: 4},

    detailsContent: {gap: 12, marginBottom: 24},
    detailRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
    detailText: {fontSize: 14, color: colors.text, flex: 1},


    bookButton: {
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    bookButtonText: {fontSize: 12, fontWeight: '800' as const, color: colors.textDark, letterSpacing: 1},

    tabContainer: {flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 16},
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: colors.surface,
    },
    activeTab: {backgroundColor: colors.primary},
    tabText: {fontSize: 14, fontWeight: '700' as const, color: colors.mutedText, letterSpacing: 1},
    activeTabText: {color: colors.textWhite},

    qrButtonContainer: {paddingHorizontal: 24, paddingBottom: 24},
    qrButton: {
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.accent,
        gap: 8,
    },
    qrButtonText: {fontSize: 14, fontWeight: '700' as const, color: colors.accent, letterSpacing: 1},

    statsContainer: {flex: 1, paddingHorizontal: 24},
    statsSection: {paddingVertical: 16},
    statsSectionTitle: {
        fontSize: 20,
        fontWeight: '800' as const,
        color: colors.text,
        marginBottom: 24,
        letterSpacing: 1,
    },

    statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32},
    statCard: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 12,
        width: '47%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statNumber: {fontSize: 24, fontWeight: '900' as const, color: colors.text, marginVertical: 8},
    statLabel: {fontSize: 12, color: colors.mutedText, textAlign: 'center'},

    favoriteSection: {marginBottom: 32},
    favoriteSectionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 16,
        letterSpacing: 1,
    },
    favoriteCard: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    favoriteText: {fontSize: 16, color: colors.text, fontWeight: '600' as const},

    subscriptionSection: {marginBottom: 32},
    subscriptionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 16,
        letterSpacing: 1,
    },
    subscriptionCard: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    subscriptionStatus: {
        fontSize: 18,
        fontWeight: '800' as const,
        color: colors.primary,
        marginBottom: 8,
        letterSpacing: 1,
    },
    subscriptionDescription: {fontSize: 14, color: colors.mutedText, lineHeight: 20},

    // header right / user area
    profileIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: colors.accent,
    },
    userInfoContainer: {flex: 1, marginLeft: 12},
    userBasicInfo: {marginBottom: 2},
    carInfoInHeader: {marginTop: 2},
    carInfoText: {fontSize: 11, color: colors.mutedText, fontWeight: '500' as const},
    headerRight: {flexDirection: 'row', alignItems: 'center', gap: 8},

    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, gap: 4,
    },
    statusText: {fontSize: 10, fontWeight: '700' as const, color: colors.accent, letterSpacing: 0.5},

    notificationButton: {position: 'relative', padding: 8},
    notificationBadge: {
        position: 'absolute', top: 4, right: 4,
        backgroundColor: colors.danger, borderRadius: 8,
        minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    },
    notificationCount: {fontSize: 10, fontWeight: '700' as const, color: colors.textWhite},

    heroSection: {
        backgroundColor: colors.accent,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        overflow: 'hidden'
    },
    heroContent: {padding: 20, alignItems: 'center'},
    heroTitle: {
        fontSize: 18,
        fontWeight: '900' as const,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 16,
        opacity: 0.86
    },
    heroStats: {flexDirection: 'row', justifyContent: 'space-around', width: '100%'},
    heroStat: {alignItems: 'center', gap: 4},
    heroStatText: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: colors.textDark,
        textAlign: 'center',
        letterSpacing: 0.5
    },

    searchContainer: {flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 12},
    searchInputContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderWidth: 1, borderColor: colors.border,
    },
    searchInput: {flex: 1, fontSize: 16, color: colors.text},
    filterButton: {
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },


    cardMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 10
    },
    distanceContainerTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    distance: {
        fontSize: 12,
        color: colors.mutedText,
        fontWeight: '500' as const,
    },
    nearestBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nearestBadgeText: {
        color: colors.textWhite,
        fontSize: 11,
        fontWeight: '700',
    },

    quickBookButton: {
        backgroundColor: colors.accent,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 8, borderRadius: 8, marginTop: 8, gap: 4,
    },
    quickBookText: {fontSize: 14, fontWeight: '700' as const, color: colors.textDark, letterSpacing: 0.5},

    // Available slots
    availableSlotsContainer: {marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border},
    availableSlotsIndicator: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2},
    availabilityDot: {width: 8, height: 8, borderRadius: 4},
    availabilityGreen: {backgroundColor: colors.success},
    availabilityYellow: {backgroundColor: colors.warning},
    availabilityRed: {backgroundColor: colors.danger},
    availableSlotsText: {fontSize: 11, fontWeight: '600' as const, color: colors.text},
    availableSlotsSubtext: {fontSize: 9, color: colors.mutedText, fontStyle: 'italic' as const},

    detailsActions: {flexDirection: 'row', gap: 12},

    carDetailsSection: {paddingHorizontal: 20, paddingVertical: 8},
    carDetailsCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border
    },
    carDetailsHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
    carDetailsTitle: {fontSize: 12, fontWeight: '600' as const, color: colors.mutedText, letterSpacing: 0.5},
    carDetailsContent: {flexDirection: 'row', alignItems: 'center'},
    carDetailsValue: {fontSize: 14, color: colors.text, fontWeight: '600' as const},

    upgradeButton: {
        backgroundColor: colors.accent,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 8, marginTop: 12, gap: 8,
    },
    upgradeButtonText: {fontSize: 12, fontWeight: '800' as const, color: colors.textDark, letterSpacing: 1},

    actionButtonsContainer: {paddingHorizontal: 24, paddingBottom: 24},
    subscriptionButton: {
        flex: 1, backgroundColor: colors.accent,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, borderRadius: 12, gap: 8,
    },
    subscriptionButtonText: {fontSize: 14, fontWeight: '800' as const, color: colors.textDark, letterSpacing: 1},

    // Profile Modal
    profileModal: {flex: 1, backgroundColor: '#fff'},
    profileHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, borderBottomColor: colors.border,
    },
    profileTitle: {fontSize: 15, fontWeight: '800' as const, color: colors.text, letterSpacing: 1},
    profileCloseButton: {padding: 8},

    profileContent: {flex: 1, paddingHorizontal: 14},
    profileUserCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, borderRadius: 16, padding: 20, marginVertical: 20,
        borderWidth: 1, borderColor: colors.border, gap: 16,
    },
    profileAvatar: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary,
    },
    profileUserInfo: {flex: 1},
    profileUserName: {fontSize: 18, fontWeight: '700' as const, color: colors.text, marginBottom: 4},
    profileUserPhone: {fontSize: 14, color: colors.mutedText, marginBottom: 8},
    profileStatusBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 12, gap: 4, alignSelf: 'flex-start',
    },
    profileStatusText: {fontSize: 10, fontWeight: '700' as const, color: colors.accent, letterSpacing: 0.5},

    settingsSection: {marginBottom: 32},
    settingsSectionTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 16,
        letterSpacing: 1
    },
    settingsItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 16,
        borderRadius: 12, marginBottom: 8, gap: 16, borderWidth: 1, borderColor: colors.border,
    },
    settingsItemText: {fontSize: 16, color: colors.text, fontWeight: '500' as const},

    logoutSection: {marginTop: 20, marginBottom: 40},
    profileLogoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.card, paddingVertical: 16, borderRadius: 12, gap: 12,
        borderWidth: 2, borderColor: colors.danger,
        margin: 10,
    },
    profileLogoutText: {fontSize: 16, fontWeight: '700' as const, color: colors.danger, letterSpacing: 1},

    // Subscription Header Button
    subscriptionHeaderButton: {
        backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
        borderColor: colors.accent, gap: 4,
    },
    subscriptionHeaderText: {fontSize: 10, fontWeight: '700' as const, color: colors.accent, letterSpacing: 0.5},
    qrHeaderButton: {padding: 8},

    // Subscription Banner
    subscriptionBanner: {
        backgroundColor: colors.accent,
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 16,
        overflow: 'hidden'
    },
    subscriptionBannerContent: {flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10},
    subscriptionBannerText: {flex: 1},
    subscriptionBannerTitle: {
        fontSize: 14,
        fontWeight: '800' as const,
        color: colors.textDark,
        marginBottom: 2,
        letterSpacing: 1
    },
    subscriptionBannerSubtitle: {fontSize: 11, fontWeight: '500' as const, color: colors.textDark, opacity: 0.86},
    subscriptionBannerButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    subscriptionBannerButtonText: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: colors.textWhite,
        letterSpacing: 0.5
    },

    // Photo / editing
    profileAvatarImage: {width: '100%', height: '100%', borderRadius: 30},
    cameraOverlay: {
        position: 'absolute', bottom: -2, right: -2,
        backgroundColor: colors.accent, borderRadius: 12, width: 24, height: 24,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card,
    },
    editNameContainer: {flexDirection: 'row', alignItems: 'center', gap: 8},
    editNameInput: {
        flex: 1, fontSize: 18, fontWeight: '700' as const, color: colors.text,
        backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 8, borderWidth: 1, borderColor: colors.primary,
    },
    editNameActions: {flexDirection: 'row', gap: 4},
    editNameCancel: {padding: 4},
    editNameSave: {padding: 4},

    // Toggle
    settingsToggleItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 16,
        borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    settingsToggleInfo: {flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16},
    settingsToggleText: {flex: 1},
    settingsItemSubtext: {fontSize: 12, color: colors.mutedText, marginTop: 2},
    toggleSwitch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.mutedGray,
        padding: 2,
        justifyContent: 'center'
    },
    toggleActive: {width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignSelf: 'flex-end'},
    toggleInactive: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.grayMedium,
        alignSelf: 'flex-start'
    },

    // Help
    helpSection: {marginBottom: 32},
    helpSectionTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 16,
        letterSpacing: 1
    },
    helpItem: {
        backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12,
        borderWidth: 1, borderColor: colors.border,
    },
    helpQuestion: {fontSize: 16, fontWeight: '600' as const, color: colors.text, marginBottom: 8},
    helpAnswer: {fontSize: 14, color: colors.mutedText, lineHeight: 20},

    contactSection: {marginBottom: 32},
    contactSectionTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: colors.text,
        marginBottom: 16,
        letterSpacing: 1
    },
    contactItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 16,
        borderRadius: 12, marginBottom: 8, gap: 16, borderWidth: 1, borderColor: colors.border,
    },
    contactText: {fontSize: 16, color: colors.text, fontWeight: '500' as const},

    // Notifications
    notificationHeaderActions: {flexDirection: 'row', alignItems: 'center', gap: 12},
    markAllReadButton: {
        paddingHorizontal: 12, paddingVertical: 6,
        backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.primary,
    },
    markAllReadText: {fontSize: 12, fontWeight: '600' as const, color: colors.primary},

    emptyNotifications: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16},
    emptyNotificationsText: {fontSize: 18, fontWeight: '600' as const, color: colors.text},
    emptyNotificationsSubtext: {fontSize: 14, color: colors.mutedText, textAlign: 'center', paddingHorizontal: 40},

    notificationsList: {paddingVertical: 16},
    notificationItem: {
        flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start', gap: 12,
    },
    notificationItemUnread: {borderColor: colors.primary, backgroundColor: colors.surfaceSelected},
    notificationIcon: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center', marginTop: 2,
    },
    notificationContent: {flex: 1},
    notificationTitle: {fontSize: 16, fontWeight: '600' as const, color: colors.text, marginBottom: 4},
    notificationTitleUnread: {fontWeight: '700' as const, color: colors.primary},
    notificationMessage: {fontSize: 14, color: colors.mutedText, lineHeight: 20, marginBottom: 8},
    notificationTime: {fontSize: 12, color: colors.disabledText},
    notificationUnreadDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6},

    // Booking Modal
    bookingModal: {flex: 1, backgroundColor: colors.background},
    bookingHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    bookingTitle: {fontSize: 20, fontWeight: '800' as const, color: colors.text, letterSpacing: 1},
    bookingCloseButton: {padding: 8},
    bookingContent: {flex: 1, paddingHorizontal: 24},

    bookingCarWashInfo: {
        flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16,
        padding: 16, marginVertical: 20, borderWidth: 1, borderColor: colors.border, gap: 16,
    },
    bookingCarWashImage: {width: 80, height: 80, borderRadius: 12},
    bookingCarWashDetails: {flex: 1},
    bookingCarWashName: {fontSize: 18, fontWeight: '700' as const, color: colors.text, marginBottom: 8},
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





    // + Bottom nav
    bottomNav: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,

        // shadow (iOS) / elevation (Android)
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: -4},
        elevation: 10,
    },
    bottomNavRow: {
        flexDirection: 'row',
        gap: 12,
    },
    bottomNavButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },
    bottomNavCTA: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.accent,
        gap: 8,
    },
    bottomNavText: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: colors.primary,
        letterSpacing: 0.5,
    },
    bottomNavCTAText: {
        fontSize: 14,
        fontWeight: '800' as const,
        color: colors.textDark,
        letterSpacing: 0.5,
    },
    myBookingsNavWrap: {
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    myBookingsNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.accent,
        paddingVertical: 10,
        borderRadius: 12,
    },
    myBookingsNavText: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: colors.textDark,
        letterSpacing: 0.5,
    },extrasGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 8,
        paddingBottom: 12,
    },

    extraBtn: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fff',        // нейтральная рамка
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: '100%',
    },

    extraBtnActive: {
        backgroundColor: colors.accent, // твой фирменный акцент
        borderColor: colors.accent,
    },

    extraBtnText: {
        fontSize: 14,
        color: colors.textDark,
        fontWeight: '600',
    },

    extraBtnTextActive: {
        color: '#FFFFFF',
    },
    checkoutCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    paymentCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    checkoutBlockTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textWhite,
        marginBottom: 12,
    },
    washRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
    washThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee' },
    washName: { fontSize: 15, fontWeight: '700', color: colors.textWhite },
    washAddress: { fontSize: 12, color: colors.mutedText, marginTop: 2 },

    extrasTitle: { fontSize: 14, fontWeight: '600', color: colors.textWhite, marginTop: 10, marginBottom: 8 },
    mutedText: { color: colors.mutedText, fontSize: 13 },

    billingCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    billingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    billingLabel: { fontSize: 14, color: colors.textWhite },
    billingValue: { fontSize: 14, color: colors.textWhite, fontWeight: '600' },
    billingDivider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 8 },
    billingTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    billingTotalLabel: { fontSize: 16, fontWeight: '800', color: colors.primary },
    billingTotalValue: { fontSize: 16, fontWeight: '800', color: colors.textWhite },

    paySelector: {
        flexDirection: 'row',
        backgroundColor: colors.accent,
        borderRadius: 12,
        padding: 4,
        gap: 6,
    },
    payOption: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    payOptionActive: { backgroundColor: colors.primary + '22' },
    payOptionActiveDisabled: { backgroundColor: '#eaeaea' },
    payOptionText: { fontSize: 14, color: colors.textWhite, fontWeight: '600' },
    payOptionTextActive: { color: colors.textWhite },
    primaryCTA: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    primaryCTAText: { color: colors.textWhite, fontSize: 16, fontWeight: '800' },
    pendingCashText: { textAlign: 'center', color: colors.mutedText, marginTop: 10 },
});
