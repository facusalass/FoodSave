import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { colors, radii, spacing } from "../constants/theme";

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
        <ActivityIndicator color={variant === "outline" ? colors.primary : "#fff"} />
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

const styles = StyleSheet.create({
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
    color: colors.primary
  }
});

const variantStyles = StyleSheet.create({
  danger: {
    backgroundColor: colors.danger
  },
  outline: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.secondary
  }
});
