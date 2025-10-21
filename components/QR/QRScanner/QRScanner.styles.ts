import { StyleSheet } from 'react-native';
import { colors } from '@/assets/Theme/colors';

export const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        zIndex: 1000,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.overlay, // rgba(255,255,255,0.2) — можно заменить на тёмный overlay при желании
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: colors.text,
        textAlign: 'center',
    },
    scanArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: colors.primary,
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    instructions: {
        paddingHorizontal: 40,
        paddingBottom: 60,
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 16,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    scanAgainButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    scanAgainText: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: colors.background,
        letterSpacing: 1,
    },
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 24,
    },
    message: {
        fontSize: 18,
        color: colors.text,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '800' as const,
        color: colors.background,
        letterSpacing: 1,
    },
    webFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 24,
    },
    webFallbackText: {
        fontSize: 16,
        color: colors.text,
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '800' as const,
        color: colors.background,
        letterSpacing: 1,
    },
});
