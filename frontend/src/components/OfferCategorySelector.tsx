import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  OFFER_CATEGORIES,
  type OfferCategory
} from "../constants/offerCategories";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type OfferCategorySelectorProps = {
  onSelect: (category: OfferCategory) => void;
  selectedCategory: OfferCategory | null;
};

export function OfferCategorySelector({
  onSelect,
  selectedCategory
}: OfferCategorySelectorProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.categoryGrid}>
      {OFFER_CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category;

        return (
          <TouchableOpacity
            activeOpacity={0.85}
            key={category}
            onPress={() => onSelect(category)}
            style={[
              styles.categoryChip,
              isSelected ? styles.categoryChipActive : null
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                isSelected ? styles.categoryTextActive : null
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
    categoryChip: {
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: radii.md,
      borderWidth: 1,
      minHeight: 42,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    categoryChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    categoryText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "900"
    },
    categoryTextActive: {
      color: "#FFFFFF"
    }
  });
}
