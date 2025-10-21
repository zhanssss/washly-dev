import { StyleSheet } from "react-native";
import { colors } from "@/assets/Theme/colors"; // 👈 подключаем централизованные цвета

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // '#000000'
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "space-between",
    },
    loadingText: {
        fontSize: 18,
        color: colors.text, // '#FFFFFF'
        textAlign: "center",
    },
});
