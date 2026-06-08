import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View
} from "react-native";
import { colors, radii, spacing } from "../constants/theme";

type TextInputFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  icon?: ReactNode;
};

export function TextInputField({
  label,
  error,
  icon,
  style,
  ...props
}: TextInputFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon}
        <TextInput
          placeholderTextColor={colors.mutedText}
          style={[styles.input, style]}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  error: {
    color: colors.danger,
    fontSize: 12
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 46,
    paddingVertical: 0
  },
  inputError: {
    borderColor: colors.danger
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  label: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0
  }
});
