import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          height: theme.borderWidths.hairline,
          backgroundColor: theme.colors.border.subtle,
          width: '100%',
        },
        style,
      ]}
    />
  );
}
