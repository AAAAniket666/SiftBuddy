import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabButtonProps {
  route: any;
  index: number;
  isFocused: boolean;
  options: any;
  navigation: any;
}

const TabButton: React.FC<TabButtonProps> = ({ route, index, isFocused, options, navigation }) => {
  const scale = useSharedValue(isFocused ? 1 : 0.9);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);
  const backgroundOpacity = useSharedValue(isFocused ? 1 : 0);

  const tabIcons = {
    Calendar: '📅',
    Swaps: '🔄',
    Profile: '👤',
  };

  const label = options.tabBarLabel !== undefined 
    ? options.tabBarLabel 
    : options.title !== undefined 
    ? options.title 
    : route.name;

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.9, {
      damping: 20,
      stiffness: 300,
    });
    opacity.value = withTiming(isFocused ? 1 : 0.6, {
      duration: 200,
    });
    backgroundOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused, scale, opacity, backgroundOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    const getBackgroundStyle = () => {
      switch (route.name) {
        case 'Calendar':
          return {
            width: 80,
            height: 50,
            borderRadius: 12,
          };
        case 'Swaps':
          return {
            width: 75,
            height: 50,
            borderRadius: 12,
          };
        case 'Profile':
          return {
            width: 75,
            height: 50,
            borderRadius: 12,
          };
        default:
          return {
            width: 70,
            height: 50,
            borderRadius: 12,
          };
      }
    };

    return {
      ...getBackgroundStyle(),
      opacity: backgroundOpacity.value,
      transform: [{ scale: withSpring(isFocused ? 1 : 0.8) }],
    };
  });

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <AnimatedTouchableOpacity
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabButton, animatedStyle]}
    >
      <Animated.View style={[styles.tabBackground, backgroundStyle]} />
      <Text style={[styles.tabIcon, isFocused ? styles.tabIconActive : styles.tabIconInactive]}>
        {tabIcons[route.name as keyof typeof tabIcons] || '•'}
      </Text>
      <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}>
        {label}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        return (
          <TabButton
            key={route.key}
            route={route}
            index={index}
            isFocused={isFocused}
            options={options}
            navigation={navigation}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabBackground: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabIconActive: {
    color: '#0EA5E9',
  },
  tabIconInactive: {
    color: '#737373',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#0EA5E9',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#737373',
    fontWeight: '700',
  },
});

export default AnimatedTabBar;
