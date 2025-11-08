import {StyleSheet} from 'react-native';
import {colors} from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
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
    profileModal: {flex: 1, backgroundColor: '#fff'},
    profileHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, borderBottomColor: colors.border,
    },
    profileTitle: {fontSize: 15, fontWeight: '800' as const, color: colors.text, letterSpacing: 1},
    profileCloseButton: {padding: 8},
    closeButtonText: {fontSize: 18, color: colors.primary},

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
    subscriptionHeaderButton: {
        backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
        borderColor: colors.accent, gap: 4,
    }, subscriptionHeaderText: {fontSize: 10, fontWeight: '700' as const, color: colors.accent, letterSpacing: 0.5},
})