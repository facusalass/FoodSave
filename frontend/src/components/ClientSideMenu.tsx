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
import { useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { type AppColors, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

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
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  function handleConfirmLogout() {
    setIsLogoutModalVisible(false);
    onLogout();
  }

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
              <X color={theme.text} size={24} />
            </Pressable>
          </View>

          <View style={styles.items}>
            <MenuItem
              icon={<Home color={theme.text} size={21} />}
              label="Inicio"
              onPress={() => onNavigate("/(client)/home")}
              styles={styles}
            />
            <MenuItem
              icon={<Search color={theme.text} size={21} />}
              label="Explorar ofertas"
              onPress={() => onNavigate("/(client)/home")}
              styles={styles}
            />
            <MenuItem
              icon={<Clock color={theme.text} size={21} />}
              label="Mis reservas"
              onPress={() => onNavigate("/(client)/reservations")}
              styles={styles}
            />
            <MenuItem
              icon={<Star color={theme.text} size={21} />}
              label="Favoritos"
              onPress={() => onNavigate("/(client)/favorites")}
              styles={styles}
            />
            <MenuItem
              icon={<User color={theme.text} size={21} />}
              label="Perfil"
              onPress={() => onNavigate("/(client)/profile")}
              styles={styles}
            />
            <MenuItem
              icon={<CircleHelp color={theme.text} size={21} />}
              label="Ayuda"
              onPress={() => onNavigate("/(client)/help")}
              styles={styles}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsLogoutModalVisible(true)}
            style={styles.logoutButton}
          >
            <LogOut color={theme.danger} size={21} />
            <Text style={styles.logoutText}>Cerrar sesion</Text>
          </TouchableOpacity>
        </View>
        <LogoutConfirmModal
          onCancel={() => setIsLogoutModalVisible(false)}
          onConfirm={handleConfirmLogout}
          visible={isLogoutModalVisible}
        />
      </View>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  muted = false,
  onPress,
  styles
}: {
  icon: ReactNode;
  label: string;
  muted?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
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

function createStyles(theme: AppColors) {
  return StyleSheet.create({
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
    backgroundColor: theme.card,
    flex: 1,
    maxWidth: 360,
    paddingBottom: spacing.xl,
    width: "82%"
  },
  header: {
    alignItems: "center",
    borderBottomColor: theme.border,
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
    color: theme.text,
    fontSize: 15,
    fontWeight: "700"
  },
  items: {
    gap: spacing.xs,
    paddingTop: spacing.lg
  },
  logo: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3
  },
  logoAccent: {
    color: theme.primary
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
    color: theme.danger,
    fontSize: 15,
    fontWeight: "800"
  },
  mutedItemText: {
    color: theme.mutedText
  },
  overlay: {
    backgroundColor: theme.overlay,
    flex: 1,
    flexDirection: "row"
  }
  });
}
