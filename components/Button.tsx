import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';
import Text from './Text';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const getButtonColors = (variant: string, disabled: boolean) => {
  if (disabled) {
    return {
      background: theme.colors.neutral[200],
      text: theme.colors.neutral[400],
      border: 'transparent',
    };
  }

  switch (variant) {
    case 'filled':
      return {
        background: theme.colors.primary[500],
        text: theme.colors.text.inverse,
        border: 'transparent',
      };
    case 'outlined':
      return {
        background: 'transparent',
        text: theme.colors.primary[500],
        border: theme.colors.primary[500],
      };
    case 'text':
      return {
        background: 'transparent',
        text: theme.colors.primary[500],
        border: 'transparent',
      };
    case 'elevated':
      return {
        background: theme.colors.surface,
        text: theme.colors.primary[500],
        border: 'transparent',
      };
    default:
      return {
        background: theme.colors.primary[500],
        text: theme.colors.text.inverse,
        border: 'transparent',
      };
  }
};

const getButtonSize = (size: string) => {
  switch (size) {
    case 'small':
      return {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        minHeight: 36,
        borderRadius: theme.borderRadius.lg,
      };
    case 'medium':
      return {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        minHeight: 48,
        borderRadius: theme.borderRadius.xl,
      };
    case 'large':
      return {
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.lg,
        minHeight: 56,
        borderRadius: theme.borderRadius.xl,
      };
    default:
      return {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        minHeight: 48,
        borderRadius: theme.borderRadius.xl,
      };
  }
};

const StyledButton = styled(TouchableOpacity)<{
  $variant: string;
  $size: string;
  $disabled: boolean;
  $fullWidth: boolean;
}>`
  background-color: ${props => getButtonColors(props.$variant, props.$disabled).background};
  border: 1px solid ${props => getButtonColors(props.$variant, props.$disabled).border};
  border-radius: ${props => getButtonSize(props.$size).borderRadius}px;
  padding-horizontal: ${props => getButtonSize(props.$size).paddingHorizontal}px;
  padding-vertical: ${props => getButtonSize(props.$size).paddingVertical}px;
  min-height: ${props => getButtonSize(props.$size).minHeight}px;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  ${props => props.$variant === 'elevated' ? theme.shadow.md : ''};
  opacity: ${props => props.$disabled ? 0.6 : 1};
`;

const ButtonContent = styled.View<{ $hasIcon: boolean; $iconPosition: string }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${props => props.$hasIcon ? theme.spacing.sm : 0}px;
`;

const IconContainer = styled.View<{ $position: string }>`
  ${props => props.$position === 'right' ? 'order: 2;' : 'order: 0;'}
`;

const Button: React.FC<ButtonProps> = ({
  variant = 'filled',
  size = 'medium',
  children,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  ...touchableProps
}) => {
  const colors = getButtonColors(variant, disabled || loading);
  const textVariant = size === 'small' ? 'label-medium' : 'label-large';

  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $disabled={disabled || loading}
      $fullWidth={fullWidth}
      style={style}
      disabled={disabled || loading}
      {...touchableProps}
    >
      <ButtonContent $hasIcon={!!icon} $iconPosition={iconPosition}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={colors.text}
          />
        ) : (
          <>
            {icon && (
              <IconContainer $position={iconPosition}>
                {icon}
              </IconContainer>
            )}
            <Text variant={textVariant} color={colors.text}>
              {children}
            </Text>
          </>
        )}
      </ButtonContent>
    </StyledButton>
  );
};

export default Button;
