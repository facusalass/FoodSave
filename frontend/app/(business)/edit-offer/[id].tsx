import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronLeft,
  ImagePlus,
  Info,
  Minus,
  Plus
} from "lucide-react-native";
import { useCallback, useState } from "react";
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
import { EmptyState } from "../../../src/components/EmptyState";
import { OfferCategorySelector } from "../../../src/components/OfferCategorySelector";
import { ScreenContainer } from "../../../src/components/ScreenContainer";
import {
  getCanonicalOfferCategory,
  type OfferCategory
} from "../../../src/constants/offerCategories";
import { type AppColors, radii, spacing } from "../../../src/constants/theme";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  getBusinessOffers,
  updateBusinessOffer,
  uploadImage,
  type UpdateBusinessOfferPayload
} from "../../../src/services/offerService";
import type { Offer, OfferType } from "../../../src/types/offer";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export default function BusinessEditOfferScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [type, setType] = useState<OfferType>("mystery_box");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<OfferCategory | null>(null);
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [stock, setStock] = useState(0);
  const [weight, setWeight] = useState("");
  const [allergens, setAllergens] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewUri, setImagePreviewUri] = useState("");

  const loadOffer = useCallback(async () => {
    if (!session) {
      setLoadError("Necesitas iniciar sesion como comercio.");
      setIsLoading(false);
      return;
    }

    if (!id) {
      setLoadError("No encontramos la publicacion a editar.");
      setIsLoading(false);
      return;
    }

    try {
      setLoadError(null);
      setIsLoading(true);
      const offers = await getBusinessOffers(session.token);
      const offer = offers.find((candidate) => candidate.id === id);

      if (!offer) {
        setLoadError("No encontramos esta publicacion en tu local.");
        return;
      }

      fillForm(offer);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos cargar la publicacion.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, session]);

  useFocusEffect(
    useCallback(() => {
      void loadOffer();
    }, [loadOffer])
  );

  function fillForm(offer: Offer) {
    setTitle(offer.title ?? "");
    setDescription(offer.description ?? "");
    setCategory(getCanonicalOfferCategory(offer.category));
    setType(offer.type);
    setOldPrice(String(offer.oldPrice ?? ""));
    setNewPrice(String(offer.newPrice ?? ""));
    setStock(Math.max(0, offer.stock ?? 0));
    setWeight(offer.estimatedWeightInKg ? String(offer.estimatedWeightInKg) : "");
    setAllergens(offer.allergens?.join(", ") ?? "");
    setImageUrl(offer.imageUrl ?? "");
    setImagePreviewUri(offer.imageUrl ?? "");
    setFormError(null);
  }

  async function handleSave() {
    if (isSaving || isUploadingImage) {
      return;
    }

    if (!session || !id) {
      setFormError("Necesitas iniciar sesion como comercio para guardar.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim() || cleanTitle;
    const parsedOldPrice = parsePrice(oldPrice);
    const parsedNewPrice = parsePrice(newPrice);
    const parsedWeight = parseOptionalNumber(weight);
    const weightWasCompleted = weight.trim().length > 0;

    if (!cleanTitle) {
      setFormError("Agrega un titulo para la publicacion.");
      return;
    }

    if (!category) {
      setFormError("Elegí una categoría para la publicación.");
      return;
    }

    if (!parsedOldPrice || parsedOldPrice <= 0) {
      setFormError("El precio original tiene que ser mayor a $0.");
      return;
    }

    if (!parsedNewPrice || parsedNewPrice <= 0) {
      setFormError("El precio rebajado tiene que ser mayor a $0.");
      return;
    }

    if (parsedNewPrice >= parsedOldPrice) {
      setFormError("El precio rebajado debe ser menor que el precio original.");
      return;
    }

    if (stock < 0) {
      setFormError("El stock no puede ser negativo.");
      return;
    }

    if (weightWasCompleted && parsedWeight === undefined) {
      setFormError("Si cargas peso aproximado, usa un numero valido.");
      return;
    }

    const payload: UpdateBusinessOfferPayload = {
      allergens: parseAllergens(allergens),
      category,
      description: cleanDescription,
      newPrice: parsedNewPrice,
      oldPrice: parsedOldPrice,
      stock,
      title: cleanTitle,
      type
    };

    if (parsedWeight !== undefined) {
      payload.estimatedWeightInKg = parsedWeight;
    }

    if (imageUrl) {
      payload.imageUrl = imageUrl;
    }

    try {
      setFormError(null);
      setIsSaving(true);
      await updateBusinessOffer(session.token, id, payload);
      Alert.alert("Cambios guardados", "Actualizamos la publicacion.", [
        {
          onPress: () =>
            router.replace({
              pathname: "/(business)/store",
              params: { tab: "publications" }
            }),
          text: "OK"
        }
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos guardar los cambios.";
      setFormError(message);
      Alert.alert("No pudimos guardar", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImagePress() {
    if (!session || isUploadingImage) {
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setFormError("Necesitamos acceso a tu galeria para elegir la imagen.");
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
        setFormError("Elegi una imagen JPG o PNG.");
        return;
      }

      if (image.fileSize && image.fileSize > MAX_IMAGE_SIZE_BYTES) {
        setFormError("La imagen puede pesar hasta 2MB.");
        return;
      }

      setFormError(null);
      setIsUploadingImage(true);
      const uploadedUrl = await uploadImage(session.token, {
        name: fileName,
        type: mimeType,
        uri: image.uri
      });
      setImageUrl(uploadedUrl);
      setImagePreviewUri(image.uri);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No pudimos subir la imagen.";
      setFormError(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer contentStyle={styles.content}>
        <Header onBack={() => router.back()} />
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.mutedText}>Cargando publicacion...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (loadError) {
    return (
      <ScreenContainer contentStyle={styles.content}>
        <Header onBack={() => router.back()} />
        <EmptyState title="No pudimos cargar la publicacion" description={loadError} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <Header onBack={() => router.back()} />

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
            <Image source={{ uri: imagePreviewUri }} style={styles.imagePreview} />
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
              {isUploadingImage ? "Subiendo imagen..." : "Cambiar Imagen"}
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
        label="Titulo"
        onChangeText={(value) => {
          setTitle(value);
          clearFormError(formError, setFormError);
        }}
        placeholder="Ej: Caja Panaderia"
        value={title}
      />
      <InputField
        label="Descripcion"
        onChangeText={(value) => {
          setDescription(value);
          clearFormError(formError, setFormError);
        }}
        placeholder="Descripcion breve"
        value={description}
      />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Categoría</Text>
        <OfferCategorySelector
          selectedCategory={category}
          onSelect={(selectedCategory) => {
            setCategory(selectedCategory);
            clearFormError(formError, setFormError);
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
            clearFormError(formError, setFormError);
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
            clearFormError(formError, setFormError);
          }}
          placeholder="$"
          value={newPrice}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Stock Disponible</Text>
        <View style={styles.stockControl}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setStock((current) => Math.max(0, current - 1));
              clearFormError(formError, setFormError);
            }}
            style={styles.stockButton}
          >
            <Minus color={theme.text} size={20} />
          </TouchableOpacity>
          <Text style={styles.stockValue}>{stock}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setStock((current) => current + 1);
              clearFormError(formError, setFormError);
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
          clearFormError(formError, setFormError);
        }}
        placeholder="Ej: 1 kg, 500 g"
        value={weight}
      />
      <InputField
        label="Alergenos (Opcional)"
        onChangeText={(value) => {
          setAllergens(value);
          clearFormError(formError, setFormError);
        }}
        placeholder="Ej: TACC, Lacteos..."
        value={allergens}
      />

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
        disabled={isSaving || isUploadingImage || !session}
        onPress={handleSave}
        style={[
          styles.saveButton,
          isSaving || isUploadingImage || !session ? styles.saveButtonDisabled : null
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        )}
      </TouchableOpacity>
    </ScreenContainer>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBack}
        style={styles.topBarButton}
      >
        <ChevronLeft color={theme.text} size={24} />
      </TouchableOpacity>
      <Text style={styles.topBarTitle}>Editar publicacion</Text>
      <View style={styles.topBarButton} />
    </View>
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

function clearFormError(
  formError: string | null,
  setFormError: (message: string | null) => void
) {
  if (formError) {
    setFormError(null);
  }
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
      flexDirection: "row",
      gap: spacing.sm,
      overflow: "hidden",
      padding: spacing.md
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
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: radii.md,
      borderStyle: "dashed",
      borderWidth: 1.5,
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 182,
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
      justifyContent: "center"
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
      height: "100%",
      width: "100%"
    },
    imageText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800"
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
    label: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "900"
    },
    loadingBlock: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl
    },
    mutedText: {
      color: theme.mutedText,
      fontSize: 14
    },
    priceField: {
      flex: 1
    },
    priceRow: {
      flexDirection: "row",
      gap: spacing.md
    },
    saveButton: {
      alignItems: "center",
      backgroundColor: theme.primary,
      borderRadius: radii.md,
      justifyContent: "center",
      minHeight: 56
    },
    saveButtonDisabled: {
      opacity: 0.72
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
      textTransform: "uppercase"
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
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 54
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
      backgroundColor: theme.primary
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
