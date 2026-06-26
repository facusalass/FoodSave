import { Redirect, Tabs } from "expo-router";
import { Search } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { SplashLoading } from "../../src/components/SplashLoading";
import { colors } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";

export default function ClientLayout() {
  const { session, isLoading } = useAuth();

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
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
        name="offer/[id]"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    minHeight: 72,
    paddingBottom: 12,
    paddingTop: 8
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600"
  }
});
