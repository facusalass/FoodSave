import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../constants/theme";
import type { ReservationStatus } from "../types/reservation";

type StatusBadgeProps = {
  status: ReservationStatus;
  label?: string;
};

const statusConfig: Record<
  ReservationStatus,
  { label: string; backgroundColor: string; color: string }
> = {
  pending: {
    backgroundColor: "#F59E0B1A",
    color: colors.warning,
    label: "Pendiente"
  },
  confirmed_paid: {
    backgroundColor: "#14B8A61A",
    color: colors.secondaryDark,
    label: "Confirmado/Pagado"
  },
  picked_up: {
    backgroundColor: "#6366F11A",
    color: colors.info,
    label: "Retirado"
  },
  cancelled: {
    backgroundColor: "#EF44441A",
    color: colors.danger,
    label: "Cancelado"
  }
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor
        }
      ]}
    >
      <Text style={[styles.label, { color: config.color }]}>
        {label ?? config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  label: {
    fontSize: 12,
    fontWeight: "800"
  }
});
