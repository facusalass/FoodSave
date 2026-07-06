import type { PropsWithChildren } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  View
} from "react-native";
import {
  SafeAreaView,
  type Edge
} from "react-native-safe-area-context";
import { type AppColors, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type ScreenContainerProps = PropsWithChildren<{
  includeBottomSafeArea?: boolean;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

const CONTENT_SAFE_AREA_EDGES: Edge[] = ["top", "left", "right"];
const FULL_SAFE_AREA_EDGES: Edge[] = ["top", "bottom", "left", "right"];

export function ScreenContainer({
  children,
  includeBottomSafeArea = false,
  scroll = true,
  contentStyle,
  onRefresh,
  refreshing = false
}: ScreenContainerProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const safeAreaEdges = includeBottomSafeArea
    ? FULL_SAFE_AREA_EDGES
    : CONTENT_SAFE_AREA_EDGES;

  if (!scroll) {
    return (
      <SafeAreaView edges={safeAreaEdges} style={styles.safeArea}>
        <View style={[styles.staticContent, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={safeAreaEdges} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={theme.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  safeArea: {
    backgroundColor: theme.background,
    flex: 1
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  staticContent: {
    flex: 1,
    padding: spacing.md
  }
  });
}
