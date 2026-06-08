import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../constants/theme";

type AdminMetricCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: "primary" | "secondary" | "info" | "warning";
};

const accentColors = {
  info: colors.info,
  primary: colors.primary,
  secondary: colors.secondary,
  warning: colors.warning
};

export function AdminMetricCard({
  label,
  value,
  icon,
  accent = "primary"
}: AdminMetricCardProps) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
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
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  value: {
    fontSize: 24,
    fontWeight: "900"
  }
});
