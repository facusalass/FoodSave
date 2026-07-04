import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { type AppColors, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export function SplashLoading() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.logoCard}>
        <Svg height={132} viewBox="0 0 132 132" width={132}>
          <Rect fill="#FFFFFF" height={112} rx={28} width={112} x={10} y={10} />
          <Path
            d="M39 70V45H93V70"
            fill="none"
            stroke="#08265A"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={10}
          />
          <Path
            d="M52 45C52 31.5 80 31.5 80 45"
            fill="none"
            stroke="#08265A"
            strokeLinecap="round"
            strokeWidth={10}
          />
          <Path
            d="M38 79C43 103 89 103 94 79"
            fill="none"
            stroke={theme.primary}
            strokeLinecap="round"
            strokeWidth={10}
          />
          <Path
            d="M55 84C50 58 68 50 95 46C97 72 80 91 56 90C63 76 74 66 85 60C71 65 60 74 55 84Z"
            fill="#58BF3B"
          />
          <Path
            d="M57 87C64 75 74 66 85 60"
            fill="none"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth={5}
          />
        </Svg>
      </View>

      <View style={styles.copy}>
        <Text style={styles.brand}>FoodSave</Text>
        <Text style={styles.message}>Rescatando comida cerca tuyo...</Text>
      </View>

      <ActivityIndicator color={theme.primary} />
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  brand: {
    color: theme.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0
  },
  container: {
    alignItems: "center",
    backgroundColor: theme.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  logoCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: 36,
    borderWidth: 1,
    elevation: 4,
    height: 164,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    width: 164
  },
  message: {
    color: theme.mutedText,
    fontSize: 15,
    textAlign: "center"
  }
  });
}
