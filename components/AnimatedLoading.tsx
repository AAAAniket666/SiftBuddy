import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

interface AnimatedLoadingProps {
  fcmToken?: string | null;
}

const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({ fcmToken: _fcmToken }) => {
  const logoScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  React.useEffect(() => {
    // Logo animation
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 600 }),
      withRepeat(
        withSequence(
          withTiming(0.95, { duration: 800 }),
          withTiming(1.05, { duration: 800 })
        ),
        -1,
        true
      )
    );

    // Title animation
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    // Spinner animation
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, [logoScale, titleOpacity, spinnerRotation]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const spinnerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.appLogo, logoAnimatedStyle]}>
          <Text style={styles.logoText}>SB</Text>
        </Animated.View>
        <Animated.Text style={[styles.appTitle, titleAnimatedStyle]}>
          ShiftBuddy
        </Animated.Text>
      </View>
      
      <Animated.View style={[styles.spinnerContainer, spinnerAnimatedStyle]}>
        <View style={styles.spinner} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  spinnerContainer: {
    marginTop: 20,
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#0EA5E9',
    borderTopColor: 'transparent',
  },
});

export default AnimatedLoading;
