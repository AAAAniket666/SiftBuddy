import React from 'react';
import { ViewStyle } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  onPress?: () => void;
  testID?: string;
}

const getCardStyle = (variant: string) => {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: theme.colors.surface,
        borderWidth: 0,
        borderColor: 'transparent',
        shadow: theme.shadow.md,
      };
    case 'outlined':
      return {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        shadow: '',
      };
    case 'filled':
      return {
        backgroundColor: theme.colors.surfaceVariant,
        borderWidth: 0,
        borderColor: 'transparent',
        shadow: '',
      };
    default:
      return {
        backgroundColor: theme.colors.surface,
        borderWidth: 0,
        borderColor: 'transparent',
        shadow: theme.shadow.md,
      };
  }
};

const getPadding = (padding: string) => {
  switch (padding) {
    case 'none':
      return 0;
    case 'small':
      return theme.spacing.md;
    case 'medium':
      return theme.spacing.lg;
    case 'large':
      return theme.spacing.xxl;
    default:
      return theme.spacing.lg;
  }
};

const StyledCard = styled.View<{ 
  $variant: string; 
  $padding: string;
  $isClickable: boolean;
}>`
  background-color: ${props => getCardStyle(props.$variant).backgroundColor};
  border-width: ${props => getCardStyle(props.$variant).borderWidth}px;
  border-color: ${props => getCardStyle(props.$variant).borderColor};
  border-radius: ${theme.borderRadius.xl}px;
  padding: ${props => getPadding(props.$padding)}px;
  ${props => getCardStyle(props.$variant).shadow};
  ${props => props.$isClickable ? 'opacity: 1;' : ''}
`;

const TouchableCard = styled.TouchableOpacity<{ 
  $variant: string; 
  $padding: string;
}>`
  background-color: ${props => getCardStyle(props.$variant).backgroundColor};
  border-width: ${props => getCardStyle(props.$variant).borderWidth}px;
  border-color: ${props => getCardStyle(props.$variant).borderColor};
  border-radius: ${theme.borderRadius.xl}px;
  padding: ${props => getPadding(props.$padding)}px;
  ${props => getCardStyle(props.$variant).shadow};
  active-opacity: 0.8;
`;

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  style,
  onPress,
  testID,
}) => {
  if (onPress) {
    return (
      <TouchableCard
        $variant={variant}
        $padding={padding}
        style={style}
        onPress={onPress}
        testID={testID}
        activeOpacity={0.8}
      >
        {children}
      </TouchableCard>
    );
  }

  return (
    <StyledCard
      $variant={variant}
      $padding={padding}
      $isClickable={false}
      style={style}
      testID={testID}
    >
      {children}
    </StyledCard>
  );
};

export default Card;
