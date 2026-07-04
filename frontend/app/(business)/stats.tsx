import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  DollarSign,
  Leaf,
  Package,
  XCircle
} from "lucide-react-native";
import { useCallback, useMemo, useState, type ReactNode } from "react";
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
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getBusinessOffers } from "../../src/services/offerService";
import { getReservationsPage } from "../../src/services/reservationService";
import type { BusinessStatistics } from "../../src/types/statistics";
import type { Offer } from "../../src/types/offer";
import type { Reservation } from "../../src/types/reservation";
import { formatCurrency } from "../../src/utils/formatCurrency";

const PAID_STATUSES = ["confirmed_paid", "picked_up"] as const;
const RESERVATIONS_LIMIT = 10000;
type StatsPeriod = "today" | "last7" | "currentMonth" | "previousMonth" | "custom";
type DateRange = { from: Date; to: Date };
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function BusinessStatsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [period, setPeriod] = useState<StatsPeriod>("currentMonth");
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(getDateInputValue(getCurrentMonthRange().from));
  const [customTo, setCustomTo] = useState(getDateInputValue(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const [nextOffers, nextReservationsPage] = await Promise.all([
        getBusinessOffers(session.token),
        getReservationsPage(session.token, {
          limit: RESERVATIONS_LIMIT,
          page: 1
        })
      ]);

      setOffers(nextOffers);
      setReservations(nextReservationsPage.items);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar las estadisticas.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [loadStats])
  );

  const selectedRange = useMemo(
    () => getDateRange(period, customFrom, customTo),
    [customFrom, customTo, period]
  );
  const customRangeError = useMemo(
    () => (period === "custom" ? validateCustomRange(customFrom, customTo) : null),
    [customFrom, customTo, period]
  );
  const statistics = useMemo(
    () =>
      selectedRange && !customRangeError
        ? buildStatsForRange(reservations, offers, selectedRange)
        : getEmptyStatistics(),
    [customRangeError, offers, reservations, selectedRange]
  );

  const hasAnyStats =
    statistics.totalRevenue > 0 ||
    statistics.boxesSold > 0 ||
    statistics.cancelledCount > 0 ||
    statistics.topOffers.length > 0;

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Estadisticas</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(business)/dashboard")}
        style={styles.backLink}
      >
        <ChevronLeft color={theme.primary} size={18} />
        <Text style={styles.backText}>Volver al inicio</Text>
      </TouchableOpacity>

      <View style={styles.filterBlock}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setIsPeriodMenuOpen((current) => !current)}
          style={styles.periodButton}
        >
          <Text style={styles.periodText}>
            {getPeriodLabel(period, customFrom, customTo)}
          </Text>
          <ChevronDown color={theme.text} size={18} />
        </TouchableOpacity>

        {isPeriodMenuOpen ? (
          <View style={styles.periodMenu}>
            <PeriodOption
              description="Solo lo que paso hoy."
              isActive={period === "today"}
              label="Hoy"
              onPress={() => selectPeriod("today")}
            />
            <PeriodOption
              description="Una mirada corta de la semana."
              isActive={period === "last7"}
              label="Ultimos 7 dias"
              onPress={() => selectPeriod("last7")}
            />
            <PeriodOption
              description="El resumen del mes en curso."
              isActive={period === "currentMonth"}
              label="Mes actual"
              onPress={() => selectPeriod("currentMonth")}
            />
            <PeriodOption
              description="Para comparar con el cierre anterior."
              isActive={period === "previousMonth"}
              label="Mes anterior"
              onPress={() => selectPeriod("previousMonth")}
            />
            <PeriodOption
              description="Elegis desde y hasta."
              isActive={period === "custom"}
              label="Rango personalizado"
              onPress={() => selectPeriod("custom")}
            />
          </View>
        ) : null}

        {period === "custom" ? (
          <View style={styles.customRangeBox}>
            <View style={styles.customRangeRow}>
              <View style={styles.customDateField}>
                <Text style={styles.customRangeLabel}>Desde</Text>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  onBlur={showCustomRangeErrorIfNeeded}
                  onChangeText={setCustomFrom}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.placeholder}
                  style={styles.customRangeInput}
                  value={customFrom}
                />
              </View>
              <View style={styles.customDateField}>
                <Text style={styles.customRangeLabel}>Hasta</Text>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  onBlur={showCustomRangeErrorIfNeeded}
                  onChangeText={setCustomTo}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.placeholder}
                  style={styles.customRangeInput}
                  value={customTo}
                />
              </View>
            </View>
            {customRangeError ? (
              <Text style={styles.rangeErrorText}>{customRangeError}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Cargando estadisticas...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar estadisticas" description={error} />
      ) : customRangeError ? (
        <EmptyState title="Revisa el rango de fechas." description={customRangeError} />
      ) : !hasAnyStats ? (
        <EmptyState title={`Todavia no hay estadisticas para ${getEmptyPeriodLabel(period)}.`} />
      ) : (
        <>
          <View style={styles.revenueCard}>
            <View style={styles.revenueLabelRow}>
              <DollarSign color="#FFFFFF" size={18} />
              <Text style={styles.revenueLabel}>Ingresos Totales</Text>
            </View>
            <Text style={styles.revenueAmount}>
              {formatCurrency(statistics.totalRevenue)}
            </Text>
          </View>

          <MetricCard
            icon={<Leaf color={theme.secondary} size={28} />}
            iconBackground={`${theme.secondary}1A`}
            label="Comida Salvada"
            value={
              statistics.savedFoodKg === null
                ? "-- KG"
                : `${formatKg(statistics.savedFoodKg)} KG`
            }
          />
          <MetricCard
            icon={<Package color="#2563EB" size={28} />}
            iconBackground="#DBEAFE"
            label="Cajas Vendidas"
            value={String(statistics.boxesSold)}
          />
          <MetricCard
            isMuted
            icon={<XCircle color={theme.placeholder} size={28} />}
            iconBackground={theme.subtleSurface}
            label="Cancelados"
            value={String(statistics.cancelledCount)}
          />

          <Text style={styles.sectionTitle}>Ventas por Semana</Text>
          <WeeklySalesChart weeklySales={statistics.weeklySales} />

          <Text style={styles.sectionTitle}>Top Publicaciones</Text>
          <View style={styles.topOffersCard}>
            {statistics.topOffers.length === 0 ? (
              <Text style={styles.emptyTopText}>
                Todavia no hay publicaciones vendidas este mes.
              </Text>
            ) : (
              statistics.topOffers.slice(0, 5).map((offer, index) => (
                <View
                  key={offer.offerId}
                  style={[
                    styles.topOfferRow,
                    index === statistics.topOffers.length - 1
                      ? styles.topOfferRowLast
                      : null
                  ]}
                >
                  <Text numberOfLines={1} style={styles.topOfferTitle}>
                    {offer.title}
                  </Text>
                  <Text style={styles.topOfferCount}>{offer.soldCount}</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScreenContainer>
  );

  function selectPeriod(nextPeriod: StatsPeriod) {
    setPeriod(nextPeriod);
    setIsPeriodMenuOpen(false);
  }

  function showCustomRangeErrorIfNeeded() {
    const nextError = validateCustomRange(customFrom, customTo);

    if (nextError) {
      Alert.alert("Rango invalido", nextError);
    }
  }
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
      activeOpacity={0.85}
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

function MetricCard({
  icon,
  iconBackground,
  isMuted,
  label,
  value
}: {
  icon: ReactNode;
  iconBackground: string;
  isMuted?: boolean;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.metricCard, isMuted ? styles.metricCardMuted : null]}>
      <View>
        <Text style={[styles.metricLabel, isMuted ? styles.mutedText : null]}>
          {label}
        </Text>
        <Text style={[styles.metricValue, isMuted ? styles.mutedText : null]}>
          {value}
        </Text>
      </View>
      <View style={[styles.metricIcon, { backgroundColor: iconBackground }]}>
        {icon}
      </View>
    </View>
  );
}

function WeeklySalesChart({
  weeklySales
}: {
  weeklySales: BusinessStatistics["weeklySales"];
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const maxValue = Math.max(...weeklySales.map((item) => item.total), 1);
  const yAxisValues = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartBody}>
        <View style={styles.yAxis}>
          {yAxisValues.map((value) => (
            <Text key={value} style={styles.axisText}>
              {formatAxisValue(value)}
            </Text>
          ))}
        </View>
        <View style={styles.chartArea}>
          <View style={styles.gridLines}>
            {[0, 1, 2, 3].map((line) => (
              <View key={line} style={styles.gridLine} />
            ))}
          </View>
          <View style={styles.barsRow}>
            {weeklySales.map((item) => (
              <View key={item.label} style={styles.barSlot}>
                <View
                  style={[
                    styles.bar,
                    { height: `${Math.max(8, (item.total / maxValue) * 100)}%` }
                  ]}
                />
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function buildStatsForRange(
  reservations: Reservation[],
  offers: Offer[],
  range: DateRange
): BusinessStatistics {
  const paidReservations = reservations.filter(
    (reservation) =>
      PAID_STATUSES.includes(
        reservation.status as (typeof PAID_STATUSES)[number]
      ) && isReservationInRange(reservation, range)
  );
  const cancelledReservations = reservations.filter(
    (reservation) =>
      reservation.status === "cancelled" && isReservationInRange(reservation, range)
  );
  const offerById = new Map(offers.map((offer) => [offer.id, offer]));
  const topOffers = new Map<string, { soldCount: number; title: string }>();
  const rangeBuckets = buildRangeBuckets(range);
  const weeklySales = rangeBuckets.map((bucket) => ({
    label: bucket.label,
    total: 0
  }));
  let totalRevenue = 0;
  let boxesSold = 0;
  let savedFoodKg = 0;
  let hasWeightData = false;

  paidReservations.forEach((reservation) => {
    const quantity = reservation.quantity ?? 1;
    const reservationDate = getReservationStatsDate(reservation);
    const weekIndex = reservationDate
      ? getRangeBucketIndex(reservationDate, rangeBuckets)
      : null;
    const offer = offerById.get(reservation.offerId);
    const currentTopOffer = topOffers.get(reservation.offerId) ?? {
      soldCount: 0,
      title: reservation.offerTitle
    };

    totalRevenue += reservation.totalPrice;
    boxesSold += quantity;

    if (weekIndex !== null && weekIndex >= 0) {
      weeklySales[weekIndex]!.total += reservation.totalPrice;
    }

    if (offer?.estimatedWeightInKg) {
      savedFoodKg += offer.estimatedWeightInKg * quantity;
      hasWeightData = true;
    }

    currentTopOffer.soldCount += quantity;
    currentTopOffer.title = offer?.title ?? reservation.offerTitle;
    topOffers.set(reservation.offerId, currentTopOffer);
  });

  return {
    boxesSold,
    cancelledCount: cancelledReservations.length,
    savedFoodKg: hasWeightData ? savedFoodKg : null,
    topOffers: Array.from(topOffers.entries())
      .map(([offerId, value]) => ({ offerId, ...value }))
      .sort((a, b) => b.soldCount - a.soldCount),
    totalRevenue,
    weeklySales
  };
}

function getEmptyStatistics(): BusinessStatistics {
  return {
    boxesSold: 0,
    cancelledCount: 0,
    savedFoodKg: null,
    topOffers: [],
    totalRevenue: 0,
    weeklySales: ["S1", "S2", "S3", "S4"].map((label) => ({ label, total: 0 }))
  };
}

function getDateRange(
  period: StatsPeriod,
  customFrom: string,
  customTo: string
): DateRange | null {
  if (period === "today") {
    return { from: startOfDay(new Date()), to: endOfDay(new Date()) };
  }

  if (period === "last7") {
    const from = new Date();
    from.setDate(from.getDate() - 6);
    return { from: startOfDay(from), to: endOfDay(new Date()) };
  }

  if (period === "currentMonth") {
    return getCurrentMonthRange();
  }

  if (period === "previousMonth") {
    return getPreviousMonthRange();
  }

  const from = parseDateInput(customFrom);
  const to = parseDateInput(customTo);

  if (!from || !to || from.getTime() > to.getTime()) {
    return null;
  }

  return { from: startOfDay(from), to: endOfDay(to) };
}

function getCurrentMonthRange(): DateRange {
  const now = new Date();
  return {
    from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  };
}

function getPreviousMonthRange(): DateRange {
  const now = new Date();
  return {
    from: startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
  };
}

function getPeriodLabel(period: StatsPeriod, customFrom: string, customTo: string) {
  if (period === "today") {
    return "Hoy";
  }

  if (period === "last7") {
    return "Ultimos 7 dias";
  }

  if (period === "currentMonth") {
    return "Mes actual";
  }

  if (period === "previousMonth") {
    return "Mes anterior";
  }

  if (!validateCustomRange(customFrom, customTo)) {
    return `${formatDisplayDate(customFrom)} - ${formatDisplayDate(customTo)}`;
  }

  return "Rango personalizado";
}

function getEmptyPeriodLabel(period: StatsPeriod) {
  if (period === "today") {
    return "hoy";
  }

  if (period === "last7") {
    return "los ultimos 7 dias";
  }

  if (period === "previousMonth") {
    return "el mes anterior";
  }

  if (period === "custom") {
    return "ese rango";
  }

  return "este mes";
}

function validateCustomRange(fromValue: string, toValue: string) {
  const from = parseDateInput(fromValue);
  const to = parseDateInput(toValue);

  if (!from || !to) {
    return "Usa el formato YYYY-MM-DD en ambas fechas.";
  }

  if (from.getTime() > to.getTime()) {
    return "La fecha desde no puede ser mayor que la fecha hasta.";
  }

  return null;
}

function parseDateInput(value: string) {
  if (!DATE_INPUT_PATTERN.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const date = parseDateInput(value);

  if (!date) {
    return value;
  }

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function isReservationInRange(reservation: Reservation, range: DateRange) {
  const date = getReservationStatsDate(reservation);

  return date
    ? date.getTime() >= range.from.getTime() && date.getTime() <= range.to.getTime()
    : false;
}

function getReservationStatsDate(reservation: Reservation) {
  const reservationWithOptionalDates = reservation as Reservation & {
    completedAt?: string;
    paidAt?: string;
    pickedUpAt?: string;
    reservationDate?: string;
  };
  const value =
    reservationWithOptionalDates.paidAt ??
    reservationWithOptionalDates.pickedUpAt ??
    reservationWithOptionalDates.completedAt ??
    reservationWithOptionalDates.createdAt ??
    reservationWithOptionalDates.reservationDate ??
    reservationWithOptionalDates.date;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildRangeBuckets(range: DateRange) {
  const duration = Math.max(range.to.getTime() - range.from.getTime(), 1);
  const bucketSize = duration / 4;

  return ["S1", "S2", "S3", "S4"].map((label, index) => ({
    from: range.from.getTime() + bucketSize * index,
    label,
    to: index === 3 ? range.to.getTime() : range.from.getTime() + bucketSize * (index + 1)
  }));
}

function getRangeBucketIndex(
  date: Date,
  buckets: Array<{ from: number; label: string; to: number }>
) {
  const time = date.getTime();

  return buckets.findIndex((bucket) => time >= bucket.from && time <= bucket.to);
}

function formatKg(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatAxisValue(value: number) {
  return String(Math.round(value));
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  axisText: {
    color: theme.placeholder,
    fontSize: 12,
    textAlign: "right"
  },
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
  bar: {
    backgroundColor: theme.primary,
    borderRadius: 7,
    minHeight: 8,
    width: "78%"
  },
  barLabel: {
    color: theme.placeholder,
    fontSize: 14,
    fontWeight: "700"
  },
  barSlot: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    height: "100%",
    justifyContent: "flex-end"
  },
  barsRow: {
    alignItems: "flex-end",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    zIndex: 1
  },
  chartArea: {
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    borderLeftColor: theme.border,
    borderLeftWidth: 1,
    flex: 1,
    height: 164,
    paddingLeft: spacing.sm,
    position: "relative"
  },
  chartBody: {
    flexDirection: "row",
    gap: spacing.sm
  },
  chartCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  content: {
    gap: spacing.md,
    paddingBottom: 96
  },
  customDateField: {
    flex: 1,
    gap: spacing.xs
  },
  customRangeBox: {
    backgroundColor: theme.card,
    borderColor: `${theme.primary}55`,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  customRangeInput: {
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  customRangeLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "900"
  },
  customRangeRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  emptyTopText: {
    color: theme.mutedText,
    fontSize: 14,
    fontWeight: "700"
  },
  filterBlock: {
    gap: spacing.sm
  },
  gridLine: {
    borderTopColor: theme.border,
    borderTopWidth: 1,
    flex: 1
  },
  gridLines: {
    bottom: 0,
    left: spacing.sm,
    position: "absolute",
    right: 0,
    top: 0
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
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 92,
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  metricCardMuted: {
    opacity: 0.78
  },
  metricIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  metricLabel: {
    color: theme.mutedText,
    fontSize: 14,
    fontWeight: "900"
  },
  metricValue: {
    color: theme.text,
    fontSize: 30,
    fontWeight: "900"
  },
  mutedText: {
    color: theme.placeholder
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
  periodText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800"
  },
  rangeErrorText: {
    color: theme.danger,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  revenueAmount: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44
  },
  revenueCard: {
    backgroundColor: theme.primary,
    borderRadius: radii.lg,
    elevation: 3,
    gap: spacing.sm,
    minHeight: 116,
    padding: spacing.lg,
    shadowColor: theme.primary,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8
  },
  revenueLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  revenueLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "900"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: theme.header,
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    justifyContent: "center",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900"
  },
  topOfferCount: {
    color: theme.primary,
    fontSize: 24,
    fontWeight: "900"
  },
  topOfferRow: {
    alignItems: "center",
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 54
  },
  topOfferRowLast: {
    borderBottomWidth: 0
  },
  topOfferTitle: {
    color: theme.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "900"
  },
  topOffersCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  yAxis: {
    height: 164,
    justifyContent: "space-between",
    width: 48
  }
  });
}
