import { useFocusEffect } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { type AppColors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getBusinessProfile } from "../../services/offerService";

export function BusinessSuspendedBanner() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isSuspended, setIsSuspended] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadStatus() {
        if (!session) {
          setIsSuspended(false);
          return;
        }

        try {
          const business = await getBusinessProfile(session.token);

          if (isMounted) {
            setIsSuspended(business.isActive === false);
          }
        } catch {
          if (isMounted) {
            setIsSuspended(false);
          }
        }
      }

      void loadStatus();

      return () => {
        isMounted = false;
      };
    }, [session])
  );

  if (!isSuspended) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.iconBox}>
        <AlertTriangle color={theme.warning} size={20} />
      </View>
      <Text style={styles.text}>
        Tu comercio fue suspendido. Tus ofertas no son visibles para los
        clientes. Contactate con soporte.
      </Text>
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
    banner: {
      alignItems: "flex-start",
      backgroundColor: `${theme.warning}1A`,
      borderColor: `${theme.warning}66`,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md
    },
    iconBox: {
      alignItems: "center",
      backgroundColor: `${theme.warning}22`,
      borderRadius: radii.sm,
      height: 32,
      justifyContent: "center",
      width: 32
    },
    text: {
      color: theme.text,
      flex: 1,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20
    }
  });
}
