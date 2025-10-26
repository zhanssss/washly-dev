// app.config.js
const base = {
    name: "Washly Car Wash App",
    owner: "washly",
    slug: "washly-car-wash-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "washly",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#14213D",
    },
    ios: {
        buildNumber: "1",
        supportsTablet: true,
        bundleIdentifier: "app.washly.carwash",
        infoPlist: {
            NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera",
            NSPhotoLibraryUsageDescription: "Allow $(PRODUCT_NAME) to access your photos",
            NSLocationWhenInUseUsageDescription:
                "Нужно, чтобы показывать ближайшие автомойки и строить маршрут.",
        },
    },
    android: {
        versionCode: 1,
        softwareKeyboardLayoutMode: "resize",
        adaptiveIcon: {
            foregroundImage: "./assets/images/adaptive-icon.png",
            backgroundColor: "#ffffff",
        },
        package: "app.washly.carwash",
        permissions: [
            "android.permission.CAMERA",
            "android.permission.ACCESS_FINE_LOCATION",
        ],
    },
    web: { favicon: "./assets/images/favicon.png" },
    experiments: { typedRoutes: true },
    extra: { eas: { projectId: "66f1bc8c-d933-4a6b-b2cd-4d1f98e2d6f6" } },
    runtimeVersion: { policy: "appVersion" },
    updates: { url: "https://u.expo.dev/66f1bc8c-d933-4a6b-b2cd-4d1f98e2d6f6" },
};

module.exports = ({ eas }) => {
    const profile = eas?.buildProfile ?? process.env.EAS_BUILD_PROFILE;
    const isProd = profile === "production";

    return {
        ...base,
        plugins: [
            // In dev: no origin; In prod: full URL (must be absolute)
            ["expo-router", isProd ? { origin: "https://washly.app" } : {}],
            ["expo-camera", { cameraPermission: "Allow Washly to access your camera", recordAudioAndroid: false }],
            ["expo-image-picker", { photosPermission: "The app accesses your photos to let you choose an image." }],
            "expo-secure-store",
            "expo-font",
            "expo-web-browser",
            [
                "expo-build-properties",
                {
                    android: { compileSdkVersion: 35, targetSdkVersion: 35, minSdkVersion: 24 },
                    ios: { deploymentTarget: "15.1" },
                },
            ],
        ],
        updates: isProd
            ? { ...base.updates, enabled: true, checkAutomatically: "ON_ERROR_RECOVERY" }
            : { enabled: false },
    };
};
