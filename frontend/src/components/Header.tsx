import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { type AppColors, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type HeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
};

export function Header({ title, subtitle, rightAction }: HeaderProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction}
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginBottom: spacing.lg
  },
  subtitle: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  }
  });
}
