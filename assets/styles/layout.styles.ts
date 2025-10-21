import { StyleSheet } from "react-native";
import { colors } from "@/assets/Theme/colors"; // ✅ подключаем токены

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // '#000000'
    },
    screenContent: {
        backgroundColor: colors.background, // '#000000'
    },
});
