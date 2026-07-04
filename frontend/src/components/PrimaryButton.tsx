import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  isLoading = false,
  icon,
  variant = "primary"
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const variantStyles = createVariantStyles(theme);

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        variantStyles[variant],
        isDisabled ? styles.disabled : null
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "outline" ? theme.primary : "#fff"} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.label,
              variant === "outline" ? styles.outlineLabel : null
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: 13
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.58
  },
  label: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
    textAlign: "center"
  },
  outlineLabel: {
    color: theme.primary
  }
  });
}

function createVariantStyles(theme: AppColors) {
  return StyleSheet.create({
  danger: {
    backgroundColor: theme.danger
  },
  outline: {
    backgroundColor: theme.card,
    borderColor: theme.primary,
    borderWidth: 1
  },
  primary: {
    backgroundColor: theme.primary
  },
  secondary: {
    backgroundColor: theme.secondary
  }
  });
}
