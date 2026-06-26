import { Clock, MapPin, Package } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../constants/theme";
import type { Reservation } from "../types/reservation";
import { StatusBadge } from "./StatusBadge";

type ReservationCardProps = {
  reservation: Reservation;
};

export function ReservationCard({ reservation }: ReservationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Package color={colors.secondary} size={17} />
          <Text style={styles.dateText}>{reservation.date}</Text>
        </View>
        <StatusBadge status={reservation.status} />
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.store}>
          {reservation.storeName.toUpperCase()}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{reservation.offerTitle}</Text>
        </View>

        <View style={styles.metaRow}>
          <MapPin color={colors.mutedText} size={17} />
          <Text numberOfLines={1} style={styles.metaText}>
            {reservation.address}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <Clock color={colors.mutedText} size={17} />
            <Text style={styles.metaText}>Retiro: {reservation.pickupTime}</Text>
          </View>
          <Text style={styles.code}>{reservation.confirmationCode}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#14B8A61A",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: colors.secondaryDark,
    fontSize: 12,
    fontWeight: "700"
  },
  body: {
    gap: spacing.sm,
    padding: spacing.md
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  code: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm
  },
  dateText: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 15
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm
  },
  metaText: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 14
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs
  },
  store: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22
  },
  topRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md
  }
});
