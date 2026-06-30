import { Bell } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";
import { useBusinessNotifications } from "../../hooks/useBusinessNotifications";
import { BusinessNotificationsModal } from "./BusinessNotificationsModal";

export function BusinessNotificationsButton() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { refresh, unreadCount } = useBusinessNotifications();

  function openNotifications() {
    setIsModalVisible(true);
    void refresh();
  }

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Ver notificaciones"
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={openNotifications}
        style={styles.button}
      >
        <Bell color={colors.text} size={23} />
        {unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
      </TouchableOpacity>

      <BusinessNotificationsModal
        onClose={() => setIsModalVisible(false)}
        visible={isModalVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44
  },
  notificationDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    position: "absolute",
    right: 8,
    top: 7,
    width: 8
  }
});
