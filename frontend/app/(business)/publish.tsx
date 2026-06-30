import {
  Clock,
  ImagePlus,
  Info,
  Menu,
  Minus,
  Plus
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle
} from "react-native";
import { BusinessNotificationsButton } from "../../src/components/business/BusinessNotificationsButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { createBusinessOffer } from "../../src/services/offerService";
import type { OfferType } from "../../src/types/offer";

const PICKUP_LIMIT = "22:00 hs";

export default function BusinessPublishScreen() {
  const { session } = useAuth();
  const [type, setType] = useState<OfferType>("mystery_box");
  const [title, setTitle] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [stock, setStock] = useState(5);
  const [weight, setWeight] = useState("");
  const [allergens, setAllergens] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  async function handlePublish() {
    if (isPublishing) {
      return;
    }

    if (!session) {
      showFormError(
        "Tu sesion no esta activa. Volve a iniciar sesion como comercio para publicar."
      );
      return;
    }

    const cleanTitle = title.trim();
    const parsedOldPrice = parsePrice(oldPrice);
    const parsedNewPrice = parsePrice(newPrice);
    const parsedWeight = parseOptionalNumber(weight);
    const weightWasCompleted = weight.trim().length > 0;

    if (!cleanTitle) {
      showFormError(
        "Agrega un nombre para la publicacion. Ejemplo: Caja Panaderia."
      );
      return;
    }

    if (!parsedOldPrice || parsedOldPrice <= 0) {
      showFormError("Ingresa el precio original. Tiene que ser mayor a $0.");
      return;
    }

    if (!parsedNewPrice || parsedNewPrice <= 0) {
      showFormError("Ingresa el precio rebajado. Tiene que ser mayor a $0.");
      return;
    }

    if (parsedNewPrice >= parsedOldPrice) {
      showFormError("El precio rebajado debe ser menor que el precio original.");
      return;
    }

    if (stock < 1) {
      showFormError("El stock disponible debe ser de al menos 1 caja.");
      return;
    }

    if (weightWasCompleted && parsedWeight === undefined) {
      showFormError(
        "Si cargas el peso aproximado, usa un numero valido. Ejemplo: 1 kg o 500 g."
      );
      return;
    }

    try {
      setFormError(null);
      setIsPublishing(true);
      await createBusinessOffer(session.token, {
        allergens: parseAllergens(allergens),
        category: cleanTitle,
        description: cleanTitle,
        estimatedWeightInKg: parsedWeight,
        newPrice: parsedNewPrice,
        oldPrice: parsedOldPrice,
        pickupLimit: PICKUP_LIMIT,
        pickupWindow: `Retirar antes de las ${PICKUP_LIMIT}`,
        stock,
        title: cleanTitle,
        type
      });

      Alert.alert("Oferta publicada", "El excedente se publico correctamente.");
      resetForm();
    } catch (publishError) {
      const message =
        publishError instanceof Error
          ? publishError.message
          : "No pudimos publicar el excedente. Intentalo nuevamente.";
      setFormError(message);
      Alert.alert("No pudimos publicar", message);
    } finally {
      setIsPublishing(false);
    }
  }

  function resetForm() {
    setType("mystery_box");
    setTitle("");
    setOldPrice("");
    setNewPrice("");
    setStock(5);
    setWeight("");
    setAllergens("");
    setFormError(null);
  }

  function clearFormError() {
    if (formError) {
      setFormError(null);
    }
  }

  function showFormError(message: string) {
    setFormError(message);
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityLabel="Abrir menu"
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert("Panel local", "El menu del comercio se habilitara pronto.")
          }
          style={styles.topBarButton}
        >
          <Menu color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Panel Local</Text>
        <BusinessNotificationsButton />
      </View>

      <Text style={styles.title}>Publicar Excedente</Text>

      <View style={styles.tabsRow}>
        <TypeTab
          isActive={type === "mystery_box"}
          label="Mystery Box"
          onPress={() => setType("mystery_box")}
        />
        <TypeTab
          isActive={type === "standard"}
          label="Especifico"
          onPress={() => setType("standard")}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Imagen del Producto</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              "Proximamente",
              "La carga de imagenes se conectara cuando definamos el flujo de seleccion de archivos."
            )
          }
          style={styles.imageBox}
        >
          <ImagePlus color="#94A3B8" size={42} />
          <Text style={styles.imageText}>Subir Imagen</Text>
          <Text style={styles.imageHint}>JPG, PNG - MAX 2MB</Text>
        </TouchableOpacity>
      </View>

      <InputField
        label="Categoria / Titulo"
        onChangeText={(value) => {
          setTitle(value);
          clearFormError();
        }}
        placeholder="Ej: Caja Panaderia"
        value={title}
      />

      <View style={styles.priceRow}>
        <InputField
          containerStyle={styles.priceField}
          keyboardType="numeric"
          label="Precio Original"
          onChangeText={(value) => {
            setOldPrice(value);
            clearFormError();
          }}
          placeholder="$"
          value={oldPrice}
        />
        <InputField
          containerStyle={styles.priceField}
          keyboardType="numeric"
          label="Precio Rebajado"
          onChangeText={(value) => {
            setNewPrice(value);
            clearFormError();
          }}
          placeholder="$"
          value={newPrice}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Stock Disponible (Cajas)</Text>
        <View style={styles.stockControl}>
          <TouchableOpacity
            accessibilityLabel="Restar stock"
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={() => {
              setStock((current) => Math.max(1, current - 1));
              clearFormError();
            }}
            style={styles.stockButton}
          >
            <Minus color={colors.text} size={20} />
          </TouchableOpacity>
          <Text style={styles.stockValue}>{stock}</Text>
          <TouchableOpacity
            accessibilityLabel="Sumar stock"
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={() => {
              setStock((current) => current + 1);
              clearFormError();
            }}
            style={styles.stockButton}
          >
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <InputField
        label="Peso Aproximado (Opcional)"
        onChangeText={(value) => {
          setWeight(value);
          clearFormError();
        }}
        placeholder="Ej: 1 kg, 500 g, 2 porciones"
        value={weight}
      />

      <InputField
        label="Alergenos (Opcional)"
        onChangeText={(value) => {
          setAllergens(value);
          clearFormError();
        }}
        placeholder="Ej: TACC, Lacteos..."
        value={allergens}
      />

      <View style={styles.limitCard}>
        <View style={styles.limitTitleRow}>
          <Info color={colors.secondary} size={15} />
          <Text style={styles.limitTitle}>Limite de retiro automatico</Text>
        </View>
        <View style={styles.limitTimeRow}>
          <Clock color={colors.primary} size={24} />
          <Text style={styles.limitTime}>{PICKUP_LIMIT}</Text>
        </View>
        <Text style={styles.limitHint}>
          Basado en el horario de cierre de tu local
        </Text>
      </View>

      {formError ? (
        <View style={styles.formErrorBox}>
          <View style={styles.formErrorAccent} />
          <View style={styles.formErrorIcon}>
            <Info color={colors.primary} size={16} />
          </View>
          <View style={styles.formErrorContent}>
            <Text style={styles.formErrorTitle}>Revisemos esta publicacion</Text>
            <Text style={styles.formErrorText}>{formError}</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.86}
        disabled={isPublishing || !session}
        onPress={handlePublish}
        style={[
          styles.publishButton,
          isPublishing || !session ? styles.publishButtonDisabled : null
        ]}
      >
        {isPublishing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.publishButtonText}>Publicar Ahora</Text>
        )}
      </TouchableOpacity>
    </ScreenContainer>
  );
}

function TypeTab({
  isActive,
  label,
  onPress
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.typeTab, isActive ? styles.typeTabActive : null]}
    >
      <Text style={[styles.typeTabText, isActive ? styles.typeTabTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InputField({
  containerStyle,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value
}: {
  containerStyle?: ViewStyle;
  keyboardType?: "default" | "numeric";
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function parsePrice(value: string) {
  const parsed = Number(value.replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumber(value: string) {
  const match = value.replace(",", ".").match(/\d+(\.\d+)?/);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseAllergens(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md
  },
  fieldGroup: {
    gap: spacing.sm
  },
  formErrorBox: {
    alignItems: "flex-start",
    backgroundColor: colors.card,
    borderColor: "#FED7AA",
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  formErrorAccent: {
    backgroundColor: colors.primary,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4
  },
  formErrorContent: {
    flex: 1,
    gap: 2,
    paddingLeft: spacing.xs
  },
  formErrorIcon: {
    alignItems: "center",
    backgroundColor: "#FF6B3514",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginLeft: spacing.xs,
    width: 32
  },
  formErrorText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 19
  },
  formErrorTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  imageBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    borderStyle: "dashed",
    borderWidth: 1.5,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 182,
    padding: spacing.lg
  },
  imageHint: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "900"
  },
  imageText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  input: {
    backgroundColor: colors.card,
    borderColor: "#D1D5DB",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  label: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900"
  },
  limitCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  limitHint: {
    color: colors.mutedText,
    fontSize: 12,
    textAlign: "center"
  },
  limitTime: {
    color: "#020617",
    fontSize: 28,
    fontWeight: "900"
  },
  limitTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  limitTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  limitTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  notificationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    position: "absolute",
    right: 10,
    top: 8,
    width: 9
  },
  priceField: {
    flex: 1
  },
  priceRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  publishButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    elevation: 2,
    justifyContent: "center",
    minHeight: 56,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 5
  },
  publishButtonDisabled: {
    opacity: 0.72
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  stockButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 56
  },
  stockControl: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "#D1D5DB",
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  stockValue: {
    color: "#020617",
    fontSize: 24,
    fontWeight: "900"
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  title: {
    color: "#020617",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  topBarTitle: {
    color: "#020617",
    fontSize: 17,
    fontWeight: "900"
  },
  typeTab: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 40
  },
  typeTabActive: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  typeTabText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  typeTabTextActive: {
    color: "#FFFFFF"
  }
});
