import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { SplashLoading } from "../../src/components/SplashLoading";
import { colors } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";

export default function BusinessLayout() {
  const { session, isLoading } = useAuth();

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
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
