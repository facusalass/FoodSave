import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  type ViewStyle,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type AppColors, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
}>;

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle
}: ScreenContainerProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.staticContent, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  safeArea: {
    backgroundColor: theme.background,
    flex: 1
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 104
  },
  staticContent: {
    flex: 1,
    padding: spacing.md
  }
  });
}
