import { Redirect, Tabs } from "expo-router";
import { PackageCheck, Search, User } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SplashLoading } from "../../src/components/SplashLoading";
import { type AppColors } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

const TAB_BAR_BASE_HEIGHT = 60;
const TAB_BAR_BOTTOM_FALLBACK = 18;

export default function ClientLayout() {
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

  if (session.user.role === "business") {
    return <Redirect href="/(business)/dashboard" />;
  }

  if (session.user.role !== "client") {
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
        name="home"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Mis reservas",
          tabBarIcon: ({ color, size }) => (
            <PackageCheck color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="offer/[id]"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="reservation-confirmed"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="notifications"
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
    height: TAB_BAR_BASE_HEIGHT + bottomPadding,
    paddingBottom: bottomPadding,
    paddingTop: 6
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600"
  }
  });
}
