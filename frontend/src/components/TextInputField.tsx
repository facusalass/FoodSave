import type { ReactNode } from "react";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View
} from "react-native";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

type TextInputFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  icon?: ReactNode;
};

export function TextInputField({
  label,
  error,
  icon,
  onBlur,
  onFocus,
  style,
  ...props
}: TextInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null
        ]}
      >
        {icon}
        <TextInput
          placeholderTextColor={theme.placeholder}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          style={[styles.input, style]}
          underlineColorAndroid="transparent"
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  error: {
    color: theme.danger,
    fontSize: 12
  },
  input: {
    color: theme.text,
    flex: 1,
    fontSize: 15,
    minHeight: 46,
    paddingVertical: 0
  },
  inputError: {
    borderColor: theme.danger
  },
  inputFocused: {
    borderColor: theme.primary
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  label: {
    color: theme.mutedText,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0
  }
  });
}
