import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type AdminMetricCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: "primary" | "secondary" | "info" | "warning";
};

export function AdminMetricCard({
  label,
  value,
  icon,
  accent = "primary"
}: AdminMetricCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const accentColors = {
    info: theme.info,
    primary: theme.primary,
    secondary: theme.secondary,
    warning: theme.warning
  };
  const color = accentColors[accent];

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
        {icon}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minWidth: 148,
    padding: spacing.md
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  label: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  value: {
    fontSize: 24,
    fontWeight: "900"
  }
  });
}
