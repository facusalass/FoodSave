import {
  Clock,
  ImagePlus,
  Info,
  Minus,
  Plus
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle
} from "react-native";
import { BusinessMenuButton } from "../../src/components/business/BusinessSideMenu";
import { BusinessNotificationsButton } from "../../src/components/business/BusinessNotificationsButton";
import { BusinessSuspendedBanner } from "../../src/components/business/BusinessSuspendedBanner";
import { OfferCategorySelector } from "../../src/components/OfferCategorySelector";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import type { OfferCategory } from "../../src/constants/offerCategories";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  createBusinessOffer,
  getBusinessProfile,
  uploadImage
} from "../../src/services/offerService";
import type { OfferType } from "../../src/types/offer";
import {
  formatClosingTimeDisplay,
  normalizeClosingTime
} from "../../src/utils/closingTime";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export default function BusinessPublishScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [type, setType] = useState<OfferType>("mystery_box");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<OfferCategory>("Varios");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [stock, setStock] = useState(5);
  const [weight, setWeight] = useState("");
  const [allergens, setAllergens] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewUri, setImagePreviewUri] = useState("");
  const [businessClosingTime, setBusinessClosingTime] = useState<string | null>(
    null
  );
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null);
  const [businessCity, setBusinessCity] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessProfile() {
      if (!session) {
        return;
      }

      try {
        const business = await getBusinessProfile(session.token);

        if (isMounted) {
          setBusinessClosingTime(normalizeClosingTime(business.closingTime));
          setBusinessLogoUrl(business.logoUrl ?? "");
          setBusinessCity(business.city ?? "");
        }
      } catch {
        if (isMounted) {
          setBusinessClosingTime(null);
          setBusinessLogoUrl("");
          setBusinessCity("");
        }
      }
    }

    void loadBusinessProfile();

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handlePublish() {
    if (isPublishing || isUploadingImage) {
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
    const pickupLimit = normalizeClosingTime(businessClosingTime);
    const pickupLimitLabel = formatClosingTimeDisplay(pickupLimit);
    const cleanBusinessCity = businessCity.trim();

    if (!cleanTitle) {
      showFormError(
        "Agrega un nombre para la publicacion. Ejemplo: Caja Panaderia."
      );
      return;
    }

    if (!cleanBusinessCity) {
      const message =
        "Completa la ciudad de tu local en Mi Local para que la oferta aparezca en el Home cliente.";
      showFormError(message);
      Alert.alert("Falta la ciudad del local", message, [
        {
          onPress: () => router.push("/(business)/store"),
          text: "Ir a Mi Local"
        },
        { text: "Volver" }
      ]);
      return;
    }

    if (!selectedCategory) {
      showFormError("Elegí una categoría para la publicación.");
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

    if (!imageUrl) {
      showFormError("Subí una imagen del producto antes de publicar.");
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
        category: selectedCategory,
        description: cleanTitle,
        estimatedWeightInKg: parsedWeight,
        imageUrl,
        newPrice: parsedNewPrice,
        oldPrice: parsedOldPrice,
        ...(pickupLimit
          ? {
              pickupLimit: pickupLimitLabel,
              pickupWindow: `Retirar antes de las ${pickupLimitLabel}`
            }
          : {}),
        stock,
        title: cleanTitle,
        type
      });

      Alert.alert("Oferta publicada", "El excedente se publico correctamente.", [
        {
          onPress: () =>
            router.replace({
              pathname: "/(business)/store",
              params: { tab: "publications" }
            }),
          text: "OK"
        }
      ]);
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
    setSelectedCategory("Varios");
    setOldPrice("");
    setNewPrice("");
    setStock(5);
    setWeight("");
    setAllergens("");
    setImageUrl("");
    setImagePreviewUri("");
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

  async function handleImagePress() {
    if (!session || isUploadingImage) {
      return;
    }

    const previousImageUrl = imageUrl;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showFormError("Necesitamos acceso a tu galeria para elegir la imagen.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        mediaTypes: ["images"],
        quality: 0.85
      });

      if (result.canceled) {
        return;
      }

      const image = result.assets.at(0);

      if (!image) {
        return;
      }

      const mimeType = image.mimeType ?? inferMimeType(image.uri);
      const fileName =
        image.fileName ?? `oferta-${Date.now()}.${getExtension(mimeType)}`;

      if (!isAllowedImageType(mimeType)) {
        showFormError("Elegi una imagen JPG o PNG.");
        return;
      }

      if (image.fileSize && image.fileSize > MAX_IMAGE_SIZE_BYTES) {
        showFormError("La imagen puede pesar hasta 2MB.");
        return;
      }

      setFormError(null);
      setImageUrl("");
      setImagePreviewUri(image.uri);
      setIsUploadingImage(true);
      const uploadedUrl = await uploadImage(session.token, {
        name: fileName,
        type: mimeType,
        uri: image.uri
      });
      setImageUrl(uploadedUrl);
    } catch (imageError) {
      const message =
        imageError instanceof Error
          ? imageError.message
          : "No pudimos subir la imagen.";
      setImageUrl(previousImageUrl);
      showFormError(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <BusinessMenuButton />
        <Text style={styles.topBarTitle}>Panel Local</Text>
        <BusinessNotificationsButton />
      </View>
      <BusinessSuspendedBanner />

      <Text style={styles.title}>Publicar Excedente</Text>

      {businessLogoUrl === "" ? (
        <View style={styles.logoInfoCard}>
          <Info color={theme.secondary} size={17} />
          <Text style={styles.logoInfoText}>
            Agregá el logo de tu comercio desde Mi Local para que tus
            publicaciones se vean más profesionales.
          </Text>
        </View>
      ) : null}

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
          disabled={isUploadingImage}
          onPress={handleImagePress}
          style={[
            styles.imageBox,
            imagePreviewUri ? styles.imageBoxWithPreview : null,
            isUploadingImage ? styles.imageBoxDisabled : null
          ]}
        >
          {imagePreviewUri ? (
            <Image
              resizeMode="cover"
              source={{ uri: imagePreviewUri }}
              style={styles.imagePreview}
            />
          ) : null}
          <View
            style={[
              styles.imageOverlay,
              imagePreviewUri ? styles.imageOverlayWithPreview : null
            ]}
          >
            {isUploadingImage ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <ImagePlus
                color={imagePreviewUri ? theme.inverseText : theme.placeholder}
                size={42}
              />
            )}
            <Text
              style={[
                styles.imageText,
                imagePreviewUri ? styles.imageTextWithPreview : null
              ]}
            >
              {isUploadingImage
                ? "Subiendo imagen..."
                : imagePreviewUri
                  ? "Imagen lista"
                  : "Subir Imagen"}
            </Text>
            <Text
              style={[
                styles.imageHint,
                imagePreviewUri ? styles.imageHintWithPreview : null
              ]}
            >
              JPG, PNG - MAX 2MB
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <InputField
        label="Título de la publicación"
        onChangeText={(value) => {
          setTitle(value);
          clearFormError();
        }}
        placeholder="Ej: Caja Panaderia"
        value={title}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Categoría</Text>
        <OfferCategorySelector
          selectedCategory={selectedCategory}
          onSelect={(category) => {
            setSelectedCategory(category);
            clearFormError();
          }}
        />
      </View>

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
            <Minus color={theme.text} size={20} />
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
            <Plus color={theme.text} size={20} />
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
          <Info color={theme.secondary} size={15} />
          <Text style={styles.limitTitle}>Limite de retiro automatico</Text>
        </View>
        <View style={styles.limitTimeRow}>
          <Clock color={theme.primary} size={24} />
          <Text style={styles.limitTime}>
            {formatClosingTimeDisplay(businessClosingTime)}
          </Text>
        </View>
        <Text style={styles.limitHint}>
          Basado en el horario de cierre de tu local
        </Text>
      </View>

      {formError ? (
        <View style={styles.formErrorBox}>
          <View style={styles.formErrorAccent} />
          <View style={styles.formErrorIcon}>
            <Info color={theme.primary} size={16} />
          </View>
          <View style={styles.formErrorContent}>
            <Text style={styles.formErrorTitle}>Revisemos esta publicacion</Text>
            <Text style={styles.formErrorText}>{formError}</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.86}
        disabled={isPublishing || isUploadingImage || !session}
        onPress={handlePublish}
        style={[
          styles.publishButton,
          isPublishing || isUploadingImage || !session
            ? styles.publishButtonDisabled
            : null
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
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
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

function inferMimeType(uri: string) {
  const lowerUri = uri.toLowerCase();

  if (lowerUri.endsWith(".png")) {
    return "image/png";
  }

  return "image/jpeg";
}

function getExtension(mimeType: string) {
  return mimeType === "image/png" ? "png" : "jpg";
}

function isAllowedImageType(mimeType: string) {
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  fieldGroup: {
    gap: spacing.sm
  },
  formErrorBox: {
    alignItems: "flex-start",
    backgroundColor: theme.card,
    borderColor: `${theme.primary}55`,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: theme.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  formErrorAccent: {
    backgroundColor: theme.primary,
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
    backgroundColor: `${theme.primary}14`,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginLeft: spacing.xs,
    width: 32
  },
  formErrorText: {
    color: theme.mutedText,
    fontSize: 13,
    lineHeight: 19
  },
  formErrorTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  imageBox: {
    alignItems: "center",
    aspectRatio: 4 / 3,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderStyle: "dashed",
    borderWidth: 1.5,
    gap: spacing.sm,
    justifyContent: "center",
    maxHeight: 220,
    minHeight: 170,
    overflow: "hidden",
    padding: spacing.lg
  },
  imageBoxDisabled: {
    opacity: 0.72
  },
  imageBoxWithPreview: {
    borderColor: theme.primary,
    borderStyle: "solid",
    padding: 0
  },
  imageHint: {
    color: theme.placeholder,
    fontSize: 12,
    fontWeight: "900"
  },
  imageHintWithPreview: {
    color: "#FFFFFFCC"
  },
  imageOverlay: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 170,
    width: "100%"
  },
  imageOverlayWithPreview: {
    backgroundColor: theme.overlay,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  imagePreview: {
    ...StyleSheet.absoluteFillObject,
    width: "100%"
  },
  imageText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  imageTextWithPreview: {
    color: "#FFFFFF"
  },
  input: {
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: theme.text,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  logoInfoCard: {
    alignItems: "flex-start",
    backgroundColor: `${theme.secondary}12`,
    borderColor: `${theme.secondary}45`,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  logoInfoText: {
    color: theme.mutedText,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  label: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  limitCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  limitHint: {
    color: theme.mutedText,
    fontSize: 12,
    textAlign: "center"
  },
  limitTime: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "900"
  },
  limitTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  limitTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  limitTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  notificationDot: {
    backgroundColor: theme.primary,
    borderColor: theme.card,
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
    backgroundColor: theme.primary,
    borderRadius: radii.md,
    elevation: 2,
    justifyContent: "center",
    minHeight: 56,
    shadowColor: theme.primary,
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
    backgroundColor: theme.card,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: 24,
    fontWeight: "900"
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  title: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: theme.header,
    borderBottomColor: theme.border,
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
    color: theme.text,
    fontSize: 17,
    fontWeight: "900"
  },
  typeTab: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 40
  },
  typeTabActive: {
    backgroundColor: theme.primary,
    elevation: 2,
    shadowColor: theme.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  typeTabText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  typeTabTextActive: {
    color: "#FFFFFF"
  }
  });
}
