import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface ScreenTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  index: number;
  style?: any;
}

const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  isActive,
  index,
  style,
}) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: 300,
    });
  }, [isActive, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      progress.value,
      [0, 1],
      [20, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.95, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenTransition;
