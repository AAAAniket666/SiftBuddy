import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  containerStyle,
  onFocus,
  onBlur,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(0);
  const labelAnimation = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    labelAnimation.value = withTiming(value || isFocused ? 1 : 0, { duration: 200 });
  }, [value, isFocused, labelAnimation]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnimation.value = withSpring(1, { damping: 20, stiffness: 300 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnimation.value = withSpring(0, { damping: 20, stiffness: 300 });
    onBlur?.(e);
  };

  const inputStyle = useAnimatedStyle(() => {
    const borderColor = interpolate(
      focusAnimation.value,
      [0, 1],
      [0, 1]
    );
    
    return {
      borderColor: error ? '#EF4444' : borderColor ? '#0EA5E9' : '#D1D5DB',
      borderWidth: withTiming(focusAnimation.value ? 2 : 1, { duration: 200 }),
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(labelAnimation.value, [0, 1], [0, -24]);
    const scale = interpolate(labelAnimation.value, [0, 1], [1, 0.8]);
    
    return {
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Animated.View style={[styles.labelContainer, labelStyle]}>
          <Text style={[styles.label, error && styles.errorLabel, isFocused && styles.focusedLabel]}>
            {label}
          </Text>
        </Animated.View>
      )}
      <AnimatedTextInput
        {...props}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[styles.input, inputStyle]}
        placeholderTextColor="#9CA3AF"
      />
      {error && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  focusedLabel: {
    color: '#0EA5E9',
  },
  errorLabel: {
    color: '#EF4444',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FFFFFF',
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 16,
    fontWeight: '500',
  },
});

export default AnimatedInput;
