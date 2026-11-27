import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

export type SegmentAccent = 'primary' | 'violet' | 'teal' | 'coral' | 'amber' | 'cobalt' | 'berry';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  accent?: SegmentAccent;
}

interface SegmentedControlProps<T extends string> {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

/**
 * Material 3 Expressive Connected Button Group.
 * Outer corners form a soft pill while inner corners stay compact (8px).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();

  const resolveColors = (accent: SegmentAccent = 'primary') => {
    if (accent === 'primary') {
      return {
        bg: theme.colors.m3.primaryContainer,
        bevel: theme.colors.expressive.violet.bevel,
        textTone: 'onPrimaryContainer' as TextColorTone,
      };
    }
    return {
      bg: theme.colors.expressive[accent].container,
      bevel: theme.colors.expressive[accent].bevel,
      textTone: accent as TextColorTone,
    };
  };

  return (
    <View style={styles.row}>
      {options.map((option, index) => {
        const selected = option.value === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        const activeStyle = resolveColors(option.accent);

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? activeStyle.bg : theme.colors.surface.primary,
                borderColor: selected ? activeStyle.bevel : theme.colors.border.subtle,
                borderWidth: theme.borderWidths.hairline,
                borderBottomWidth: selected ? 3 : 2,
                borderBottomColor: selected ? activeStyle.bevel : theme.colors.border.bevel,
                borderTopLeftRadius:
                  selected || isFirst ? theme.shapes.full : theme.shapes.extraSmall,
                borderBottomLeftRadius:
                  selected || isFirst ? theme.shapes.full : theme.shapes.extraSmall,
                borderTopRightRadius:
                  selected || isLast ? theme.shapes.full : theme.shapes.extraSmall,
                borderBottomRightRadius:
                  selected || isLast ? theme.shapes.full : theme.shapes.extraSmall,
              },
            ]}
          >
            <EditorialText
              variant="label"
              tone={selected ? activeStyle.textTone : 'secondary'}
              numberOfLines={1}
              style={{ fontFamily: selected ? theme.fonts.bodySemiBold : theme.fonts.bodyMedium }}
            >
              {option.label}
            </EditorialText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  segment: {
    flex: 1,
    minWidth: 0,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
