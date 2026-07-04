import { StyleSheet, Text, View } from "react-native";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import type { ReservationStatus } from "../types/reservation";

type StatusBadgeProps = {
  status: ReservationStatus;
  label?: string;
};

const statusConfig: Record<
  ReservationStatus,
  { label: string; color: (theme: AppColors) => string }
> = {
  pending: {
    color: (theme) => theme.warning,
    label: "Pendiente"
  },
  confirmed_paid: {
    color: (theme) => theme.secondaryDark,
    label: "Confirmado/Pagado"
  },
  picked_up: {
    color: (theme) => theme.info,
    label: "Retirado"
  },
  cancelled: {
    color: (theme) => theme.danger,
    label: "Cancelado"
  }
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { theme } = useTheme();
  const config = statusConfig[status];
  const color = config.color(theme);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}1A`
        }
      ]}
    >
      <Text style={[styles.label, { color }]}>
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
