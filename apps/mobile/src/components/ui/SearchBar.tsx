import { Search, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accentColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Material 3 Expressive pill Search Bar with clear control.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  accentColor,
  accessibilityLabel = 'Search',
  style,
}: SearchBarProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const iconColor = accentColor ?? theme.colors.m3.primary;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: focused
            ? theme.colors.m3.surfaceContainerLowest
            : theme.colors.m3.surfaceContainerHigh,
          borderColor: focused ? iconColor : 'transparent',
          borderWidth: focused ? theme.borderWidths.medium : 0,
          borderRadius: theme.shapes.full,
        },
        style,
      ]}
    >
      <Search
        size={19}
        strokeWidth={2}
        color={focused ? iconColor : theme.colors.m3.onSurfaceVariant}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        selectionColor={iconColor}
        cursorColor={iconColor}
        underlineColorAndroid="transparent"
        importantForAutofill="no"
        accessibilityLabel={accessibilityLabel}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            fontFamily: theme.fonts.bodyRegular,
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.m3.onSurface,
          },
        ]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          style={[
            styles.clearBtn,
            {
              backgroundColor: theme.colors.m3.surfaceContainerHighest,
              borderRadius: theme.shapes.full,
            },
          ]}
        >
          <X size={14} strokeWidth={2.3} color={theme.colors.m3.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  clearBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
