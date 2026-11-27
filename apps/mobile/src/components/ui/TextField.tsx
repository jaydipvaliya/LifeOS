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
    ? theme.colors.m3.error
    : isFocused
      ? theme.colors.m3.primary
      : theme.colors.m3.outlineVariant;

  const borderWidth =
    isFocused || errorText ? theme.borderWidths.medium : theme.borderWidths.hairline;

  return (
    <View style={styles.container}>
      <EditorialText
        variant="label"
        tone={errorText ? 'danger' : isFocused ? 'forest' : 'primary'}
        style={{ marginBottom: 6 }}
      >
        {label}
      </EditorialText>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isFocused
              ? theme.colors.surface.elevated
              : theme.colors.m3.surfaceContainerLow,
            borderColor,
            borderWidth,
            borderBottomWidth: isFocused ? 3 : theme.borderWidths.hairline,
            borderRadius: theme.shapes.medium,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        {leftAdornment ? (
          <View style={{ marginRight: theme.spacing.xs }}>{leftAdornment}</View>
        ) : null}
        <TextInput
          placeholderTextColor={theme.colors.text.muted}
          selectionColor={theme.colors.m3.primary}
          cursorColor={theme.colors.m3.primary}
          underlineColorAndroid="transparent"
          importantForAutofill="no"
          style={[
            styles.input,
            {
              fontFamily: theme.fonts.bodyRegular,
              fontSize: theme.typography.body.fontSize,
              color: theme.colors.m3.onSurface,
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
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    backgroundColor: 'transparent',
  },
});
