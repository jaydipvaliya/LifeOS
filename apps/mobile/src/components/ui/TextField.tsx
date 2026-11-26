import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme';
import { EditorialText } from './Typography';

interface TextFieldProps extends TextInputProps {
  label: string;
  helperText?: string;
  errorText?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

export function TextField({
  label,
  helperText,
  errorText,
  leftAdornment,
  rightAdornment,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = errorText
    ? theme.colors.status.danger
    : isFocused
      ? theme.colors.brand.primaryForest
      : theme.colors.border.subtle;

  return (
    <View style={styles.container}>
      <EditorialText variant="label" tone="primary" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </EditorialText>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.surface.primary,
            borderColor,
            borderWidth: theme.borderWidths.hairline,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        {leftAdornment ? (
          <View style={{ marginRight: theme.spacing.xs }}>{leftAdornment}</View>
        ) : null}
        <TextInput
          placeholderTextColor={theme.colors.text.muted}
          style={[
            styles.input,
            {
              fontFamily: theme.fonts.bodyRegular,
              fontSize: theme.typography.body.fontSize,
              color: theme.colors.text.primary,
            },
            style,
          ]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          accessibilityLabel={label}
          {...rest}
        />
        {rightAdornment ? (
          <View style={{ marginLeft: theme.spacing.xs }}>{rightAdornment}</View>
        ) : null}
      </View>
      {errorText ? (
        <EditorialText variant="caption" tone="danger" style={{ marginTop: theme.spacing.xxs }}>
          {errorText}
        </EditorialText>
      ) : helperText ? (
        <EditorialText variant="caption" tone="muted" style={{ marginTop: theme.spacing.xxs }}>
          {helperText}
        </EditorialText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
});
