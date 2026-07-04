import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {icon}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl
  },
  description: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  title: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center"
  }
  });
}
