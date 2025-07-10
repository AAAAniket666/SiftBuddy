import React, { useState } from 'react';
import { TextInput, TextInputProps, ViewStyle } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';
import Text from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getInputHeight = (size: string) => {
  switch (size) {
    case 'small':
      return 40;
    case 'medium':
      return 48;
    case 'large':
      return 56;
    default:
      return 48;
  }
};

const Container = styled.View<{ $fullWidth?: boolean }>`
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
`;

const InputContainer = styled.View<{
  $variant: string;
  $size: string;
  $focused: boolean;
  $error: boolean;
  $disabled: boolean;
}>`
  flex-direction: row;
  align-items: center;
  background-color: ${props => {
    if (props.$disabled) return theme.colors.neutral[100];
    return props.$variant === 'filled' 
      ? theme.colors.surfaceVariant 
      : theme.colors.surface;
  }};
  border: 1px solid ${props => {
    if (props.$error) return theme.colors.error[500];
    if (props.$focused) return theme.colors.primary[500];
    return props.$variant === 'outlined' 
      ? theme.colors.outline 
      : 'transparent';
  }};
  border-radius: ${theme.borderRadius.md}px;
  height: ${props => getInputHeight(props.$size)}px;
  padding-horizontal: ${theme.spacing.md}px;
`;

const StyledTextInput = styled(TextInput)<{
  $size: string;
  $disabled: boolean;
}>`
  flex: 1;
  font-size: ${props => props.$size === 'small' ? 14 : 16}px;
  color: ${props => props.$disabled ? theme.colors.neutral[400] : theme.colors.text.primary};
  padding: 0;
  margin: 0;
`;

const IconContainer = styled.View`
  margin-horizontal: ${theme.spacing.xs}px;
`;

const LabelContainer = styled.View`
  margin-bottom: ${theme.spacing.xs}px;
`;

const HelperContainer = styled.View`
  margin-top: ${theme.spacing.xs}px;
`;

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  style,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [focused, setFocused] = useState(false);

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  const placeholderColor = disabled 
    ? theme.colors.neutral[300]
    : theme.colors.neutral[400];

  return (
    <Container style={style} $fullWidth>
      {label && (
        <LabelContainer>
          <Text 
            variant="label-medium" 
            color={error ? theme.colors.error[500] : 'secondary'}
          >
            {label}
          </Text>
        </LabelContainer>
      )}
      
      <InputContainer
        $variant={variant}
        $size={size}
        $focused={focused}
        $error={!!error}
        $disabled={disabled}
      >
        {leftIcon && (
          <IconContainer>
            {leftIcon}
          </IconContainer>
        )}
        
        <StyledTextInput
          $size={size}
          $disabled={disabled}
          editable={!disabled}
          placeholderTextColor={placeholderColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />
        
        {rightIcon && (
          <IconContainer>
            {rightIcon}
          </IconContainer>
        )}
      </InputContainer>
      
      {(error || helperText) && (
        <HelperContainer>
          <Text 
            variant="body-small" 
            color={error ? theme.colors.error[500] : 'tertiary'}
          >
            {error || helperText}
          </Text>
        </HelperContainer>
      )}
    </Container>
  );
};

export default Input;
