import { Plus } from "lucide-react-native";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";

export default function BusinessPublishScreen() {
  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>PUBLICAR</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Plus color={colors.primary} size={28} />
        </View>
        <Text style={styles.title}>Publicar excedente próximamente</Text>
        <Text style={styles.description}>
          En una próxima fase vas a poder crear ofertas, cargar fotos y definir
          cupos desde esta pantalla.
        </Text>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() =>
            Alert.alert(
              "Próximamente",
              "Vas a poder publicar excedentes desde esta sección."
            )
          }
          style={styles.primaryAction}
        >
          <Plus color="#FFFFFF" size={20} />
          <Text style={styles.primaryActionText}>Publicar Excedente</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 5
  },
  content: {
    gap: spacing.lg
  },
  description: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#FF6B3514",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    width: "100%"
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    justifyContent: "center",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  }
});
