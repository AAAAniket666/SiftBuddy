import React from 'react';
import { Text as RNText, TextStyle } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';

interface TextProps {
  variant?: 'display-large' | 'display-medium' | 'display-small' | 
           'headline-large' | 'headline-medium' | 'headline-small' |
           'title-large' | 'title-medium' | 'title-small' |
           'body-large' | 'body-medium' | 'body-small' |
           'label-large' | 'label-medium' | 'label-small';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | string;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
  onPress?: () => void;
  testID?: string;
}

const getVariantStyle = (variant: string) => {
  const [category, size] = variant.split('-');
  const categoryStyles = theme.typography[category as keyof typeof theme.typography];
  
  if (categoryStyles && typeof categoryStyles === 'object') {
    const sizeStyle = (categoryStyles as any)[size];
    if (sizeStyle) return sizeStyle;
  }
  
  return theme.typography.body.medium;
};

const getColorValue = (color: string) => {
  switch (color) {
    case 'primary':
      return theme.colors.text.primary;
    case 'secondary':
      return theme.colors.text.secondary;
    case 'tertiary':
      return theme.colors.text.tertiary;
    case 'inverse':
      return theme.colors.text.inverse;
    default:
      return color;
  }
};

const StyledText = styled(RNText)<{ $variant: string; $color: string }>`
  font-size: ${props => getVariantStyle(props.$variant).fontSize}px;
  font-weight: ${props => getVariantStyle(props.$variant).fontWeight};
  line-height: ${props => getVariantStyle(props.$variant).lineHeight}px;
  color: ${props => getColorValue(props.$color)};
`;

const Text: React.FC<TextProps> = ({
  variant = 'body-medium',
  color = 'primary',
  children,
  style,
  numberOfLines,
  onPress,
  testID,
}) => {
  return (
    <StyledText
      $variant={variant}
      $color={color}
      style={style}
      numberOfLines={numberOfLines}
      onPress={onPress}
      testID={testID}
    >
      {children}
    </StyledText>
  );
};

export default Text;
