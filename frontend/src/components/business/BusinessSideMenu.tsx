import { usePathname, useRouter } from "expo-router";
import {
  BarChart3,
  ClipboardList,
  Clock,
  Home,
  LogOut,
  Menu,
  Plus,
  Store
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
import { LogoutConfirmModal } from "../LogoutConfirmModal";
import { type AppColors, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

type BusinessRoute =
  | "/(business)/dashboard"
  | "/(business)/publish"
  | "/(business)/orders"
  | "/(business)/history"
  | "/(business)/stats"
  | "/(business)/store";

type BusinessMenuItem = {
  icon: (color: string) => ReactNode;
  key: string;
  label: string;
  route: BusinessRoute;
};

const MENU_ITEMS: BusinessMenuItem[] = [
  {
    icon: (color) => <Home color={color} size={21} />,
    key: "dashboard",
    label: "Inicio",
    route: "/(business)/dashboard"
  },
  {
    icon: (color) => <Plus color={color} size={22} />,
    key: "publish",
    label: "Publicar excedente",
    route: "/(business)/publish"
  },
  {
    icon: (color) => <ClipboardList color={color} size={21} />,
    key: "orders",
    label: "Pedidos",
    route: "/(business)/orders"
  },
  {
    icon: (color) => <Clock color={color} size={21} />,
    key: "history",
    label: "Historial",
    route: "/(business)/history"
  },
  {
    icon: (color) => <BarChart3 color={color} size={21} />,
    key: "stats",
    label: "Estadisticas",
    route: "/(business)/stats"
  },
  {
    icon: (color) => <Store color={color} size={21} />,
    key: "store",
    label: "Mi local",
    route: "/(business)/store"
  }
];

export function BusinessMenuButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Abrir menu"
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={() => setIsVisible(true)}
        style={styles.menuButton}
      >
        <Menu color={theme.text} size={24} />
      </TouchableOpacity>
      <BusinessSideMenu
        onClose={() => setIsVisible(false)}
        visible={isVisible}
      />
    </>
  );
}

export function BusinessSideMenu({
  onClose,
  visible
}: {
  onClose: () => void;
  visible: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  function handleNavigate(item: BusinessMenuItem) {
    onClose();
    router.push(item.route);
  }

  function handleLogoutPress() {
    setIsLogoutModalVisible(true);
  }

  function handleConfirmLogout() {
    setIsLogoutModalVisible(false);
    onClose();
    void logout().then(() => router.replace("/(auth)/login"));
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View style={styles.panel}>
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item) => {
              const isActive = item.route ? pathname.includes(item.key) : false;

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  key={item.key}
                  onPress={() => handleNavigate(item)}
                  style={[styles.menuItem, isActive ? styles.menuItemActive : null]}
                >
                  <View style={styles.iconSlot}>{item.icon(theme.text)}</View>
                  <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogoutPress}
            style={styles.logoutButton}
          >
            <LogOut color={theme.danger} size={21} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
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

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  backdrop: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  iconSlot: {
    alignItems: "center",
    width: 28
  },
  logoutButton: {
    alignItems: "center",
    borderTopColor: theme.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 66,
    paddingHorizontal: spacing.lg
  },
  logoutText: {
    color: theme.danger,
    fontSize: 15,
    fontWeight: "900"
  },
  menuButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg
  },
  menuItemActive: {
    backgroundColor: theme.subtleSurface
  },
  menuList: {
    paddingTop: spacing.lg
  },
  menuText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "900"
  },
  overlay: {
    backgroundColor: theme.overlay,
    flex: 1
  },
  panel: {
    backgroundColor: theme.card,
    flex: 1,
    justifyContent: "space-between",
    maxWidth: 290,
    width: "76%"
  }
  });
}
