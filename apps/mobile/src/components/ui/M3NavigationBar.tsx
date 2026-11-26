import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { EditorialText } from './Typography';

export interface M3TabBarRoute {
  key: string;
  name: string;
  params?: object;
}

export interface M3TabBarProps {
  state: {
    index: number;
    routes: M3TabBarRoute[];
  };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        tabBarLabel?: unknown;
        tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
      };
    }
  >;
  emitter?: {
    emit: (options: {
      type: 'tabPress' | 'tabLongPress';
      target: string;
      canPreventDefault?: boolean;
    }) => unknown;
  };
  navigateToTab?: (routeKey: string) => void;
  navigation?: {
    emit: (event: {
      type: 'tabPress' | 'tabLongPress';
      target?: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
}

interface NavTabItemProps {
  label: string;
  focused: boolean;
  icon: (color: string, focused: boolean) => React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
}

function NavTabItem({ label, focused, icon, onPress, onLongPress }: NavTabItemProps) {
  const { theme } = useTheme();
  const pillProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    pillProgress.value = withSpring(focused ? 1 : 0, theme.motion.expressiveSpatial);
  }, [focused, pillProgress, theme.motion.expressiveSpatial]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillProgress.value,
    transform: [{ scaleX: 0.72 + pillProgress.value * 0.28 }],
  }));

  const activeIconColor = theme.colors.m3.onSecondaryContainer;
  const inactiveIconColor = theme.colors.m3.onSurfaceVariant;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.tabItem}
    >
      <View style={styles.pillWrapper}>
        <Animated.View
          style={[
            styles.activePill,
            {
              backgroundColor: theme.colors.m3.secondaryContainer,
              borderRadius: theme.shapes.full,
            },
            pillAnimatedStyle,
          ]}
        />
        <View style={styles.iconContainer}>
          {icon(focused ? activeIconColor : inactiveIconColor, focused)}
        </View>
      </View>
      <EditorialText
        variant="caption"
        tone={focused ? 'forest' : 'muted'}
        style={{
          fontFamily: focused ? theme.fonts.bodySemiBold : theme.fonts.bodyMedium,
          marginTop: 4,
        }}
      >
        {label}
      </EditorialText>
    </Pressable>
  );
}

export function M3NavigationBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  navigation,
}: M3TabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.m3.surfaceContainer,
          borderTopColor: theme.colors.m3.outlineVariant,
          borderTopWidth: theme.borderWidths.hairline,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const options = descriptor?.options;
        const label =
          typeof options?.tabBarLabel === 'string'
            ? options.tabBarLabel
            : typeof options?.title === 'string'
              ? options.title
              : route.name;

        const focused = state.index === index;

        const onPress = () => {
          const event = emitter
            ? emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            : navigation?.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

          const prevented = Boolean(
            (event as { defaultPrevented?: boolean } | undefined)?.defaultPrevented,
          );
          if (!focused && !prevented) {
            if (navigateToTab) {
              navigateToTab(route.key);
            } else {
              navigation?.navigate(route.name, route.params);
            }
          }
        };

        const onLongPress = () => {
          if (emitter) {
            emitter.emit({ type: 'tabLongPress', target: route.key });
          } else {
            navigation?.emit({ type: 'tabLongPress', target: route.key });
          }
        };

        return (
          <NavTabItem
            key={route.key}
            label={label}
            focused={focused}
            onPress={onPress}
            onLongPress={onLongPress}
            icon={(color, isFocused) =>
              options?.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color, size: 22 })
                : null
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillWrapper: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
