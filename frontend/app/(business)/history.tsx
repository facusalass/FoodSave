import { useFocusEffect, useRouter } from "expo-router";
import { ChevronDown, ChevronLeft, DollarSign, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { BusinessMenuButton } from "../../src/components/business/BusinessSideMenu";
import { BusinessSuspendedBanner } from "../../src/components/business/BusinessSuspendedBanner";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getReservationsPage } from "../../src/services/reservationService";
import type {
  Reservation,
  ReservationStatus
} from "../../src/types/reservation";
import { formatCurrency } from "../../src/utils/formatCurrency";
import { getReservationCode } from "../../src/utils/reservationStatus";

type HistoryPeriod = "7" | "30" | "custom" | "all";

const PAGE_SIZE = 30;
const DEFAULT_CUSTOM_DAYS = "14";
const HISTORY_STATUSES: ReservationStatus[] = [
  "confirmed_paid",
  "picked_up",
  "cancelled"
];
const PAID_STATUSES: ReservationStatus[] = ["confirmed_paid", "picked_up"];

export default function BusinessHistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [period, setPeriod] = useState<HistoryPeriod>("7");
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [customDays, setCustomDays] = useState(DEFAULT_CUSTOM_DAYS);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadHistory = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const nextPage = await getReservationsPage(session.token, {
        limit: PAGE_SIZE,
        page: 1
      });
      setReservations(nextPage.items);
      setCurrentPage(nextPage.page);
      setTotalPages(nextPage.totalPages);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar el historial.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const loadMoreHistory = useCallback(async () => {
    if (!session || isLoadingMore || currentPage >= totalPages) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const nextPage = await getReservationsPage(session.token, {
        limit: PAGE_SIZE,
        page: currentPage + 1
      });
      setReservations((current) => [...current, ...nextPage.items]);
      setCurrentPage(nextPage.page);
      setTotalPages(nextPage.totalPages);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar mas historial.";
      Alert.alert("No pudimos cargar mas", message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, isLoadingMore, session, totalPages]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  const historyReservations = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const periodDays = getPeriodDays(period, customDays);

    return reservations
      .filter((reservation) => HISTORY_STATUSES.includes(reservation.status))
      .filter((reservation) =>
        periodDays === null
          ? true
          : isWithinLastDays(reservation.createdAt, periodDays)
      )
      .filter((reservation) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          getReservationCode(reservation)
            .toLowerCase()
            .includes(normalizedSearch) ||
          reservation.offerTitle.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => getReservationTime(b) - getReservationTime(a));
  }, [customDays, period, reservations, searchText]);

  const totalCharged = useMemo(() => {
    return historyReservations
      .filter((reservation) => PAID_STATUSES.includes(reservation.status))
      .reduce((total, reservation) => total + reservation.totalPrice, 0);
  }, [historyReservations]);

  const groupedReservations = useMemo(
    () => groupReservationsByDate(historyReservations),
    [historyReservations]
  );

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <BusinessMenuButton />
        <Text style={styles.topBarTitle}>Historial</Text>
        <View style={styles.topBarSpacer} />
      </View>
      <BusinessSuspendedBanner />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(business)/dashboard")}
        style={styles.backLink}
      >
        <ChevronLeft color={theme.primary} size={18} />
        <Text style={styles.backText}>Volver al inicio</Text>
      </TouchableOpacity>

      <View style={styles.searchBox}>
        <Search color={theme.placeholder} size={18} />
        <TextInput
          autoCapitalize="characters"
          onChangeText={setSearchText}
          placeholder="Buscar por codigo (ej: FS-11A)"
          placeholderTextColor={theme.placeholder}
          style={styles.searchInput}
          value={searchText}
        />
      </View>

      <View style={styles.filterBlock}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setIsPeriodMenuOpen((current) => !current)}
          style={styles.periodButton}
        >
          <Text style={styles.periodText}>{getPeriodLabel(period, customDays)}</Text>
          <ChevronDown color={theme.text} size={18} />
        </TouchableOpacity>

        {isPeriodMenuOpen ? (
          <View style={styles.periodMenu}>
            <PeriodOption
              description="Para ver como viene la semana."
              isActive={period === "7"}
              label="Ultimos 7 dias"
              onPress={() => {
                setPeriod("7");
                setIsPeriodMenuOpen(false);
              }}
            />
            <PeriodOption
              description="Ideal para revisar el cierre del mes."
              isActive={period === "30"}
              label="Ultimo mes"
              onPress={() => {
                setPeriod("30");
                setIsPeriodMenuOpen(false);
              }}
            />
            <PeriodOption
              description="Elegis el periodo que queres consultar."
              isActive={period === "custom"}
              label="Rango de dias"
              onPress={() => {
                setPeriod("custom");
                setIsPeriodMenuOpen(false);
              }}
            />
            <PeriodOption
              description="Todo lo que ya tenes registrado."
              isActive={period === "all"}
              label="Todo"
              onPress={() => {
                setPeriod("all");
                setIsPeriodMenuOpen(false);
              }}
            />
          </View>
        ) : null}

        {period === "custom" ? (
          <View style={styles.customRangeBox}>
            <Text style={styles.customRangeLabel}>Cantidad de dias</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={setCustomDays}
              placeholder="Ej: 15"
              placeholderTextColor={theme.placeholder}
              style={styles.customRangeInput}
              value={customDays}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalLabelRow}>
          <DollarSign color="#FFFFFF" size={18} />
          <Text style={styles.totalLabel}>Total Cobrado</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(totalCharged)}</Text>
        {period === "all" ? (
          <Text style={styles.totalHint}>Sobre el historial cargado</Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar el historial" description={error} />
      ) : groupedReservations.length === 0 ? (
        <EmptyState title={`No hay historial para ${getPeriodEmptyLabel(period, customDays)}.`} />
      ) : (
        <>
          <View style={styles.groupList}>
            {groupedReservations.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.dateTitle}>{group.label}</Text>
                <View style={styles.cardList}>
                  {group.items.map((reservation) => (
                    <HistoryCard key={reservation.id} reservation={reservation} />
                  ))}
                </View>
              </View>
            ))}
          </View>

          {currentPage < totalPages ? (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoadingMore}
              onPress={loadMoreHistory}
              style={styles.loadMoreButton}
            >
              {isLoadingMore ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Text style={styles.loadMoreText}>Cargar mas historial</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}

function PeriodOption({
  description,
  isActive,
  label,
  onPress
}: {
  description: string;
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.periodOption, isActive ? styles.periodOptionActive : null]}
    >
      <View style={styles.periodOptionTextBlock}>
        <Text
          style={[
            styles.periodOptionLabel,
            isActive ? styles.periodOptionLabelActive : null
          ]}
        >
          {label}
        </Text>
        <Text style={styles.periodOptionDescription}>{description}</Text>
      </View>
      <View
        style={[
          styles.periodOptionDot,
          isActive ? styles.periodOptionDotActive : null
        ]}
      />
    </TouchableOpacity>
  );
}

function HistoryCard({ reservation }: { reservation: Reservation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const isCancelled = reservation.status === "cancelled";
  const statusLabel = getStatusLabel(reservation.status);

  return (
    <View style={[styles.historyCard, isCancelled ? styles.cancelledCard : null]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.code, isCancelled ? styles.mutedText : null]}>
          #{getReservationCode(reservation)}
        </Text>
        <Text style={[styles.timeText, isCancelled ? styles.mutedText : null]}>
          {formatHistoryTime(reservation)}
        </Text>
      </View>
      <View style={styles.cardBodyRow}>
        <View style={styles.cardMain}>
          <Text style={[styles.price, isCancelled ? styles.cancelledPrice : null]}>
            {formatCurrency(reservation.totalPrice)}
          </Text>
          <Text style={[styles.offerTitle, isCancelled ? styles.mutedText : null]}>
            {reservation.offerTitle}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            isCancelled ? styles.cancelledBadge : styles.paidBadge
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isCancelled ? styles.cancelledBadgeText : styles.paidBadgeText
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getPeriodDays(period: HistoryPeriod, customDays: string) {
  if (period === "7") {
    return 7;
  }

  if (period === "30") {
    return 30;
  }

  if (period === "all") {
    return null;
  }

  const parsedDays = Number(customDays.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 1;
}

function getPeriodLabel(period: HistoryPeriod, customDays: string) {
  if (period === "7") {
    return "Ultimos 7 dias";
  }

  if (period === "30") {
    return "Ultimo mes";
  }

  if (period === "all") {
    return "Todo el historial cargado";
  }

  const days = getPeriodDays(period, customDays);
  return `Ultimos ${days} dias`;
}

function getPeriodEmptyLabel(period: HistoryPeriod, customDays: string) {
  if (period === "all") {
    return "el historial cargado";
  }

  return getPeriodLabel(period, customDays).toLowerCase();
}

function getStatusLabel(status: ReservationStatus) {
  if (status === "cancelled") {
    return "Cancelado";
  }

  if (status === "confirmed_paid") {
    return "Cobrado";
  }

  return "Retirado";
}

function groupReservationsByDate(reservations: Reservation[]) {
  const groups = new Map<string, Reservation[]>();

  reservations.forEach((reservation) => {
    const label = formatHistoryDate(reservation);
    const current = groups.get(label) ?? [];
    current.push(reservation);
    groups.set(label, current);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items
  }));
}

function isWithinLastDays(createdAt: string | undefined, days: number) {
  if (!createdAt) {
    return true;
  }

  const timestamp = Date.parse(createdAt);

  if (Number.isNaN(timestamp)) {
    return true;
  }

  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return timestamp >= since;
}

function getReservationTime(reservation: Reservation) {
  const timestamp = Date.parse(reservation.createdAt ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatHistoryDate(reservation: Reservation) {
  if (!reservation.createdAt) {
    return reservation.date || "Sin fecha";
  }

  const date = new Date(reservation.createdAt);

  if (Number.isNaN(date.getTime())) {
    return reservation.date || "Sin fecha";
  }

  const formatted = date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return formatted.replace(
    / de ([a-z])/,
    (_, firstLetter: string) => ` de ${firstLetter.toUpperCase()}`
  );
}

function formatHistoryTime(reservation: Reservation) {
  const timestamp = Date.parse(reservation.createdAt ?? "");

  if (!Number.isNaN(timestamp)) {
    const time = new Date(timestamp).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit"
      });

    return `${time} hs`;
  }

  return reservation.pickupTime || "--:-- hs";
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  backLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36
  },
  backText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  cancelledBadge: {
    backgroundColor: theme.subtleSurface,
    borderColor: theme.border
  },
  cancelledBadgeText: {
    color: theme.mutedText
  },
  cancelledCard: {
    opacity: 0.82
  },
  cancelledPrice: {
    color: theme.placeholder
  },
  cardBodyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  cardList: {
    gap: spacing.sm
  },
  cardMain: {
    flex: 1,
    gap: spacing.xs
  },
  code: {
    color: theme.mutedText,
    fontSize: 14,
    fontWeight: "800"
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  dateTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  customRangeBox: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  customRangeInput: {
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: theme.text,
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  customRangeLabel: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800"
  },
  filterBlock: {
    gap: spacing.sm
  },
  group: {
    gap: spacing.md
  },
  groupList: {
    gap: spacing.lg
  },
  historyCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 5
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
  loadMoreButton: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46
  },
  loadMoreText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  mutedText: {
    color: theme.placeholder
  },
  offerTitle: {
    color: theme.mutedText,
    fontSize: 14
  },
  paidBadge: {
    backgroundColor: `${theme.secondary}1A`,
    borderColor: `${theme.secondary}55`
  },
  paidBadgeText: {
    color: theme.secondaryDark
  },
  periodButton: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4
  },
  periodText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800"
  },
  periodMenu: {
    backgroundColor: theme.card,
    borderColor: `${theme.primary}55`,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 3,
    gap: spacing.xs,
    padding: spacing.sm,
    shadowColor: theme.primary,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8
  },
  periodOption: {
    alignItems: "center",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  periodOptionActive: {
    backgroundColor: `${theme.primary}12`
  },
  periodOptionDescription: {
    color: theme.mutedText,
    fontSize: 12,
    lineHeight: 17
  },
  periodOptionDot: {
    borderColor: theme.border,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14
  },
  periodOptionDotActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  periodOptionLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  periodOptionLabelActive: {
    color: theme.primary
  },
  periodOptionTextBlock: {
    flex: 1,
    gap: 2
  },
  price: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm
  },
  searchInput: {
    color: theme.text,
    flex: 1,
    fontSize: 14,
    minHeight: 40,
    paddingVertical: 0
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800"
  },
  timeText: {
    color: theme.mutedText,
    fontSize: 14
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
  topBarSpacer: {
    width: 44
  },
  topBarTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900"
  },
  totalAmount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    textAlign: "center"
  },
  totalCard: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: radii.lg,
    elevation: 3,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: theme.primary,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 8
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  totalHint: {
    color: "#FFFFFFCC",
    fontSize: 12,
    fontWeight: "700"
  },
  totalLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  }
  });
}
