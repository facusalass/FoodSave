import {
  CircleHelp,
  Clock,
  Home,
  LogOut,
  Search,
  Star,
  User,
  X
} from "lucide-react-native";
import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { colors, spacing } from "../constants/theme";

export type ClientMenuRoute =
  | "/(client)/home"
  | "/(client)/reservations"
  | "/(client)/favorites"
  | "/(client)/help"
  | "/(client)/profile";

type ClientSideMenuProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: ClientMenuRoute) => void;
  onLogout: () => void;
};

export function ClientSideMenu({
  visible,
  onClose,
  onNavigate,
  onLogout
}: ClientSideMenuProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          <View style={styles.header}>
            <Text style={styles.logo}>
              FOOD<Text style={styles.logoAccent}>SAVE</Text>
            </Text>
            <Pressable
              accessibilityLabel="Cerrar menu"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X color={colors.text} size={24} />
            </Pressable>
          </View>

          <View style={styles.items}>
            <MenuItem
              icon={<Home color={colors.text} size={21} />}
              label="Inicio"
              onPress={() => onNavigate("/(client)/home")}
            />
            <MenuItem
              icon={<Search color={colors.text} size={21} />}
              label="Explorar ofertas"
              onPress={() => onNavigate("/(client)/home")}
            />
            <MenuItem
              icon={<Clock color={colors.text} size={21} />}
              label="Mis reservas"
              onPress={() => onNavigate("/(client)/reservations")}
            />
            <MenuItem
              icon={<Star color={colors.text} size={21} />}
              label="Favoritos"
              onPress={() => onNavigate("/(client)/favorites")}
            />
            <MenuItem
              icon={<User color={colors.text} size={21} />}
              label="Perfil"
              onPress={() => onNavigate("/(client)/profile")}
            />
            <MenuItem
              icon={<CircleHelp color={colors.text} size={21} />}
              label="Ayuda"
              onPress={() => onNavigate("/(client)/help")}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onLogout}
            style={styles.logoutButton}
          >
            <LogOut color={colors.primary} size={21} />
            <Text style={styles.logoutText}>Cerrar sesion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  muted = false,
  onPress
}: {
  icon: ReactNode;
  label: string;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.item}
    >
      {icon}
      <Text style={[styles.itemText, muted ? styles.mutedItemText : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  closeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  drawer: {
    backgroundColor: colors.card,
    flex: 1,
    maxWidth: 360,
    paddingBottom: spacing.xl,
    width: "82%"
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 68,
    paddingHorizontal: spacing.md
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg
  },
  itemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  items: {
    gap: spacing.xs,
    paddingTop: spacing.lg
  },
  logo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3
  },
  logoAccent: {
    color: colors.primary
  },
  logoutButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    minHeight: 52,
    paddingHorizontal: spacing.lg
  },
  logoutText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800"
  },
  mutedItemText: {
    color: colors.mutedText
  },
  overlay: {
    backgroundColor: "#00000033",
    flex: 1,
    flexDirection: "row"
  }
});
