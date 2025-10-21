// app/layout/_layout.tsx
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Stack} from "expo-router";
import { SplashScreen } from "expo-router";
import React, {useEffect, useState} from "react";
import {StatusBar} from "expo-status-bar";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet"; // 👈 добавь
import {AuthProvider} from "@/contexts/AuthContext";
import {VisitsProvider} from "@/contexts/VisitsContext";
import {trpc, trpcClient} from "@/lib/trpc";
import {styles} from '@/assets/styles/layout.styles'
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import {GestureHandlerRootView} from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
    return (
        <>
            <StatusBar style="light" backgroundColor="#000000"/>
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: styles.screenContent
            }}>
                <Stack.Screen name="index"/>
                <Stack.Screen name="car-owner/index"/>
                <Stack.Screen name="car-wash/index"/>
                <Stack.Screen name="verification/index"/>
                <Stack.Screen name="car-registration"/>
                <Stack.Screen name="subscription"/>
                <Stack.Screen name="map"/>
                <Stack.Screen name="my-bookings/index" />
            </Stack>
        </>
    );
}

export default function RootLayout() {

    const [ready, setReady] = useState(false);
    useEffect(() => {
        setReady(true);
    }, []);

    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                await SplashScreen.hideAsync();                    // 👈 прячем, когда готовы
            } catch {}
        })();
    }, [ready]);

    if (!ready) return null;

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView style={styles.container}>
                    <BottomSheetModalProvider>
                        <AuthProvider>
                            <VisitsProvider>
                                <RootLayoutNav/>
                            </VisitsProvider>
                        </AuthProvider>
                    </BottomSheetModalProvider>
                </GestureHandlerRootView>
            </QueryClientProvider>
        </trpc.Provider>
    );
}
