import { useRouter } from "expo-router";
import {
  BarChart3,
  Bell,
  ClipboardList,
  Clock,
  FileText,
  Menu,
  Plus,
  Store
} from "lucide-react-native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { getOffers } from "../../src/services/offerService";
import { getReservations } from "../../src/services/reservationService";
import type { Offer } from "../../src/types/offer";
import type { Reservation } from "../../src/types/reservation";

const FALLBACK_CLOSING_TIME = "22:00 HS";

export default function BusinessDashboardScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        setIsLoading(true);
        const [nextOffers, nextReservations] = await Promise.all([
          getOffers(),
          getReservations(session.token)
        ]);
        setOffers(
          nextOffers.filter(
            (offer) => offer.businessId === session.user.businessId
          )
        );
        setReservations(nextReservations);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar el panel del comercio.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [session]);

  const activeOffersCount = useMemo(() => {
    return offers.filter((offer) => offer.stock > 0).length;
  }, [offers]);

  const todayReservationsCount = useMemo(() => {
    const today = new Date();

    return reservations.filter((reservation) => {
      if (!reservation.createdAt) {
        return reservation.status === "pending";
      }

      const reservationDate = new Date(reservation.createdAt);

      return (
        reservationDate.getFullYear() === today.getFullYear() &&
        reservationDate.getMonth() === today.getMonth() &&
        reservationDate.getDate() === today.getDate()
      );
    }).length;
  }, [reservations]);

  const businessName = getBusinessDisplayName({
    fallbackUserName: session?.user.name,
    offers
  });

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  function showPlaceholder(message: string) {
    Alert.alert("Próximamente", message);
  }

  function handleMenuPress() {
    Alert.alert("Panel local", "¿Querés cerrar sesión?", [
      { text: "Volver", style: "cancel" },
      {
        onPress: () => {
          void handleLogout();
        },
        style: "destructive",
        text: "Cerrar sesión"
      }
    ]);
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityLabel="Abrir menú"
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={handleMenuPress}
          style={styles.topBarButton}
        >
          <Menu color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Panel Local</Text>
        <TouchableOpacity
          accessibilityLabel="Ver notificaciones"
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() =>
            showPlaceholder(
              "Las notificaciones del comercio se van a habilitar más adelante."
            )
          }
          style={styles.topBarButton}
        >
          <Bell color={colors.text} size={23} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.greetingBlock}>
          <Text numberOfLines={2} style={styles.businessName}>
            Hola, {toTitleCase(businessName)}
          </Text>
        </View>
        <View style={styles.closingBadge}>
          <Clock color={colors.secondaryDark} size={14} />
          <Text style={styles.closingText}>
            Cierre hoy: {FALLBACK_CLOSING_TIME.toLowerCase()}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando panel...</Text>
        </View>
      ) : (
        <>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.metricsGrid}>
            <MetricCard
              accent="primary"
              icon={<BarChart3 color={colors.primary} size={22} />}
              label="Ofertas Activas"
              value={String(activeOffersCount)}
            />
            <MetricCard
              accent="secondary"
              icon={<Store color={colors.secondaryDark} size={22} />}
              label="Reservas Hoy"
              value={String(todayReservationsCount)}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() =>
              showPlaceholder(
                "Próximamente vas a poder publicar excedentes desde acá."
              )
            }
            style={styles.publishButton}
          >
            <Plus color="#FFFFFF" size={22} />
            <Text style={styles.publishButtonText}>Publicar Excedente</Text>
          </TouchableOpacity>

          <View style={styles.quickSection}>
            <Text style={styles.sectionTitle}>Accesos Directos</Text>
            <View style={styles.quickGrid}>
              <QuickAction
                accent="primary"
                icon={<ClipboardList color={colors.primary} size={24} />}
                label="Ver pedidos"
                onPress={() => router.push("/(business)/orders")}
              />
              <QuickAction
                accent="secondary"
                icon={<FileText color={colors.secondaryDark} size={24} />}
                label="Historial"
                onPress={() =>
                  showPlaceholder("El historial del comercio estará disponible pronto.")
                }
              />
              <QuickAction
                accent="info"
                icon={<BarChart3 color={colors.info} size={24} />}
                label="Estadísticas"
                onPress={() =>
                  showPlaceholder(
                    "Las estadísticas detalladas estarán disponibles pronto."
                  )
                }
              />
              <QuickAction
                accent="purple"
                icon={<Store color="#A855F7" size={24} />}
                label="Mi local"
                onPress={() =>
                  showPlaceholder("La edición de datos del local se habilitará pronto.")
                }
              />
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function MetricCard({
  accent,
  icon,
  label,
  value
}: {
  accent: "primary" | "secondary";
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const accentColor =
    accent === "primary" ? colors.primary : colors.secondaryDark;

  return (
    <View style={styles.metricCard}>
      <View
        style={[
          styles.metricIcon,
          { backgroundColor: accent === "primary" ? "#FF6B3514" : "#14B8A61A" }
        ]}
      >
        {icon}
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function QuickAction({
  accent,
  icon,
  label,
  onPress
}: {
  accent: "primary" | "secondary" | "info" | "purple";
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const accentBackground = {
    info: "#6366F114",
    primary: "#FF6B3514",
    purple: "#A855F714",
    secondary: "#14B8A61A"
  }[accent];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.quickAction}
    >
      <View style={[styles.quickIcon, { backgroundColor: accentBackground }]}>
        {icon}
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function getBusinessDisplayName({
  fallbackUserName,
  offers
}: {
  fallbackUserName?: string;
  offers: Offer[];
}) {
  const offerStoreName = offers.find((offer) => offer.storeName)?.storeName;
  return (offerStoreName ?? fallbackUserName ?? "LA ESPIGA").toUpperCase();
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  businessName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28
  },
  closingBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#14B8A61A",
    borderColor: "#14B8A655",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  closingText: {
    color: colors.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  content: {
    gap: spacing.lg
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800"
  },
  greetingBlock: {
    gap: spacing.xs
  },
  hero: {
    gap: spacing.sm
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: 14
  },
  metricCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 126,
    minWidth: 140,
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5
  },
  metricIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  metricLabel: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "800"
  },
  metricValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900"
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  notificationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    position: "absolute",
    right: 10,
    top: 9,
    width: 9
  },
  publishButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    elevation: 2,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 5
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    minHeight: 132,
    minWidth: 140,
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 5
  },
  quickActionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  quickSection: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  topBarTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  }
});
