import { Redirect, Tabs } from "expo-router";
import { ClipboardList, LayoutDashboard, Plus } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SplashLoading } from "../../src/components/SplashLoading";
import { type AppColors } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

const TAB_BAR_BASE_HEIGHT = 60;
const TAB_BAR_BOTTOM_FALLBACK = 18;

export default function BusinessLayout() {
  const { session, isLoading } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);

  if (isLoading) {
    return <SplashLoading />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role === "client") {
    return <Redirect href="/(client)/home" />;
  }

  if (session.user.role !== "business") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedText,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: "Publicar",
          tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="edit-offer/[id]"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}

function createStyles(theme: AppColors, bottomInset: number) {
  const bottomPadding = Math.max(bottomInset, TAB_BAR_BOTTOM_FALLBACK);

  return StyleSheet.create({
  tabBar: {
    backgroundColor: theme.header,
    borderTopColor: theme.border,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 0,
    height: TAB_BAR_BASE_HEIGHT + bottomPadding,
    left: 0,
    paddingBottom: bottomPadding,
    paddingTop: 6,
    position: "absolute",
    right: 0
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600"
  }
  });
}
