import { LogOut } from "lucide-react-native";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type LogoutConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function LogoutConfirmModal({
  onCancel,
  onConfirm,
  visible
}: LogoutConfirmModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Cancelar cierre de sesion"
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.backdrop}
        />
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <LogOut color={theme.danger} size={26} />
          </View>
          <Text style={styles.title}>Cerrar sesion</Text>
          <Text style={styles.message}>Seguro que queres cerrar tu sesion?</Text>

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={onConfirm}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmText}>Cerrar sesion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={onCancel}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    width: "100%"
  },
  cancelText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "900"
  },
  card: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: radii.lg,
    elevation: 8,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    maxWidth: 360,
    padding: spacing.lg,
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    width: "88%"
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: theme.danger,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 50,
    width: "100%"
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: `${theme.danger}1A`,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  message: {
    color: theme.mutedText,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.xs,
    textAlign: "center"
  },
  overlay: {
    alignItems: "center",
    backgroundColor: theme.overlay,
    flex: 1,
    justifyContent: "center"
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  }
  });
}
