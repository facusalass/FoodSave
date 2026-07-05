import { useFocusEffect, useRouter } from "expo-router";
import {
  BarChart3,
  ClipboardList,
  Clock,
  FileText,
  Plus,
  Store
} from "lucide-react-native";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { BusinessMenuButton } from "../../src/components/business/BusinessSideMenu";
import { BusinessNotificationsButton } from "../../src/components/business/BusinessNotificationsButton";
import { BusinessSuspendedBanner } from "../../src/components/business/BusinessSuspendedBanner";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getBusinessOffers,
  getBusinessProfile
} from "../../src/services/offerService";
import { getReservations } from "../../src/services/reservationService";
import type { Offer } from "../../src/types/offer";
import type { Reservation } from "../../src/types/reservation";
import { formatClosingTimeDisplay } from "../../src/utils/closingTime";

const DASHBOARD_REFRESH_MS = 5000;

export default function BusinessDashboardScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [businessLogoUrl, setBusinessLogoUrl] = useState("");
  const [businessClosingTime, setBusinessClosingTime] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadDashboard(showLoading: boolean) {
        if (!session) {
          if (isActive) {
            setIsLoading(false);
          }
          return;
        }

        try {
          if (isActive) {
            setError(null);
            setIsLoading((current) => (showLoading ? true : current));
          }
          const [nextOffers, nextReservations, businessProfile] =
            await Promise.all([
              getBusinessOffers(session.token),
              getReservations(session.token),
              getBusinessProfile(session.token)
            ]);

          if (!isActive) {
            return;
          }

          setOffers(nextOffers);
          setReservations(nextReservations);
          setBusinessLogoUrl(businessProfile.logoUrl ?? "");
          setBusinessClosingTime(businessProfile.closingTime ?? null);
        } catch (loadError) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "No pudimos cargar el panel del comercio.";
          if (isActive) {
            setError(message);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadDashboard(true);
      const refreshIntervalId = setInterval(() => {
        void loadDashboard(false);
      }, DASHBOARD_REFRESH_MS);

      return () => {
        isActive = false;
        clearInterval(refreshIntervalId);
      };
    }, [session])
  );

  const activeOffersCount = useMemo(() => {
    return offers.filter((offer) => offer.isVisible !== false && offer.stock > 0)
      .length;
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

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <BusinessMenuButton />
        <Text style={styles.topBarTitle}>Panel Local</Text>
        <BusinessNotificationsButton />
      </View>
      <BusinessSuspendedBanner />

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          {businessLogoUrl ? (
            <Image source={{ uri: businessLogoUrl }} style={styles.businessLogo} />
          ) : (
            <View style={styles.businessLogoPlaceholder}>
              <Text style={styles.businessLogoInitial}>
                {getBusinessInitial(businessName)}
              </Text>
            </View>
          )}
          <View style={styles.greetingBlock}>
            <Text numberOfLines={2} style={styles.businessName}>
              Hola, {toTitleCase(businessName)}
            </Text>
          </View>
        </View>
        <View style={styles.closingBadge}>
          <Clock color={theme.secondaryDark} size={14} />
          <Text style={styles.closingText}>
            Cierre hoy: {formatClosingTimeDisplay(businessClosingTime)}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Cargando panel...</Text>
        </View>
      ) : (
        <>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.metricsGrid}>
            <MetricCard
              accent="primary"
              icon={<BarChart3 color={theme.primary} size={22} />}
              label="Ofertas Activas"
              value={String(activeOffersCount)}
            />
            <MetricCard
              accent="secondary"
              icon={<Store color={theme.secondaryDark} size={22} />}
              label="Reservas Hoy"
              value={String(todayReservationsCount)}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => router.push("/(business)/publish")}
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
                icon={<ClipboardList color={theme.primary} size={24} />}
                label="Ver pedidos"
                onPress={() => router.push("/(business)/orders")}
              />
              <QuickAction
                accent="secondary"
                icon={<FileText color={theme.secondaryDark} size={24} />}
                label="Historial"
                onPress={() => router.push("/(business)/history")}
              />
              <QuickAction
                accent="info"
                icon={<BarChart3 color={theme.info} size={24} />}
                label="Estadísticas"
                onPress={() => router.push("/(business)/stats")}
              />
              <QuickAction
                accent="purple"
                icon={<Store color="#A855F7" size={24} />}
                label="Mi local"
                onPress={() => router.push("/(business)/store")}
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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const accentColor =
    accent === "primary" ? theme.primary : theme.secondaryDark;

  return (
    <View style={styles.metricCard}>
      <View
        style={[
          styles.metricIcon,
          { backgroundColor: `${accentColor}1A` }
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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const purple = "#A855F7";
  const accentColor = {
    info: theme.info,
    primary: theme.primary,
    purple,
    secondary: theme.secondary
  }[accent];
  const accentBackground = {
    info: `${theme.info}14`,
    primary: `${theme.primary}14`,
    purple: `${purple}14`,
    secondary: `${theme.secondary}1A`
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

function getBusinessInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "F";
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  businessName: {
    color: theme.text,
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28
  },
  businessLogo: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    width: 48
  },
  businessLogoInitial: {
    color: theme.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  businessLogoPlaceholder: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderColor: `${theme.primary}55`,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  closingBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: `${theme.secondary}1A`,
    borderColor: `${theme.secondary}55`,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  closingText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl
  },
  errorText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "800"
  },
  greetingBlock: {
    flex: 1,
    gap: spacing.xs
  },
  hero: {
    gap: spacing.sm
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  loadingText: {
    color: theme.mutedText,
    fontSize: 14
  },
  metricCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
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
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "800"
  },
  metricValue: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "900"
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  notificationDot: {
    backgroundColor: theme.primary,
    borderColor: theme.card,
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
    backgroundColor: theme.primary,
    borderRadius: radii.md,
    elevation: 2,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: spacing.md,
    shadowColor: theme.primary,
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
    backgroundColor: theme.card,
    borderColor: theme.border,
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
    color: theme.text,
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
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: theme.header,
    borderBottomColor: theme.border,
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
    color: theme.text,
    fontSize: 17,
    fontWeight: "900"
  }
  });
}
