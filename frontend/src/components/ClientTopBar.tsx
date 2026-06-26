import { Bell, Menu } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";

type ClientTopBarProps = {
  onMenuPress: () => void;
};

export function ClientTopBar({ onMenuPress }: ClientTopBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Abrir menu"
        accessibilityRole="button"
        onPress={onMenuPress}
        style={styles.iconButton}
      >
        <Menu color={colors.text} size={24} />
      </Pressable>

      <Text style={styles.logo}>
        FOOD<Text style={styles.logoAccent}>SAVE</Text>
      </Text>

      <View style={styles.bellWrapper}>
        <Bell color={colors.text} size={22} />
        <View style={styles.notificationDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bellWrapper: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 68,
    paddingHorizontal: spacing.md
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  logo: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3
  },
  logoAccent: {
    color: colors.primary
  },
  notificationDot: {
    backgroundColor: colors.secondary,
    borderColor: colors.card,
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    position: "absolute",
    right: 10,
    top: 10,
    width: 9
  }
});
