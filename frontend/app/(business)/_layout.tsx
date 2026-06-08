import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";

export default function BusinessLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role !== "business") {
    return <Redirect href="/(client)/home" />;
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
  loading: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  },
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
