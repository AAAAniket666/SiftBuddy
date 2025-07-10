import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';

interface IconButtonProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}

const getButtonSize = (size: string) => {
  switch (size) {
    case 'small':
      return { width: 32, height: 32, borderRadius: 16 };
    case 'medium':
      return { width: 40, height: 40, borderRadius: 20 };
    case 'large':
      return { width: 48, height: 48, borderRadius: 24 };
    default:
      return { width: 40, height: 40, borderRadius: 20 };
  }
};

const getButtonStyle = (variant: string, disabled: boolean) => {
  if (disabled) {
    return {
      backgroundColor: theme.colors.neutral[100],
      borderColor: 'transparent',
    };
  }

  switch (variant) {
    case 'filled':
      return {
        backgroundColor: theme.colors.primary[500],
        borderColor: 'transparent',
      };
    case 'tonal':
      return {
        backgroundColor: theme.colors.primary[100],
        borderColor: 'transparent',
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderColor: theme.colors.outline,
      };
    case 'standard':
    default:
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      };
  }
};

const StyledIconButton = styled(TouchableOpacity)<{
  $size: string;
  $variant: string;
  $disabled: boolean;
}>`
  width: ${props => getButtonSize(props.$size).width}px;
  height: ${props => getButtonSize(props.$size).height}px;
  border-radius: ${props => getButtonSize(props.$size).borderRadius}px;
  background-color: ${props => getButtonStyle(props.$variant, props.$disabled).backgroundColor};
  border: 1px solid ${props => getButtonStyle(props.$variant, props.$disabled).borderColor};
  align-items: center;
  justify-content: center;
  opacity: ${props => props.$disabled ? 0.6 : 1};
`;

const IconButton: React.FC<IconButtonProps> = ({
  children,
  size = 'medium',
  variant = 'standard',
  disabled = false,
  onPress,
  testID,
}) => {
  return (
    <StyledIconButton
      $size={size}
      $variant={variant}
      $disabled={disabled}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {children}
    </StyledIconButton>
  );
};

export default IconButton;
