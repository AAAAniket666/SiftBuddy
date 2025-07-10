import React from 'react';
import { ViewStyle } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';

interface SurfaceProps {
  children: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4;
  style?: ViewStyle;
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
}

const getShadowStyle = (elevation: number) => {
  switch (elevation) {
    case 0:
      return '';
    case 1:
      return theme.shadow.sm;
    case 2:
      return theme.shadow.md;
    case 3:
      return theme.shadow.lg;
    case 4:
      return theme.shadow.xl;
    default:
      return theme.shadow.md;
  }
};

const getBorderRadius = (borderRadius: string) => {
  switch (borderRadius) {
    case 'none':
      return 0;
    case 'small':
      return theme.borderRadius.sm;
    case 'medium':
      return theme.borderRadius.md;
    case 'large':
      return theme.borderRadius.lg;
    case 'full':
      return theme.borderRadius.full;
    default:
      return theme.borderRadius.md;
  }
};

const StyledSurface = styled.View<{
  $elevation: number;
  $borderRadius: string;
}>`
  background-color: ${theme.colors.surface};
  border-radius: ${props => getBorderRadius(props.$borderRadius)}px;
  ${props => getShadowStyle(props.$elevation)};
`;

const Surface: React.FC<SurfaceProps> = ({
  children,
  elevation = 1,
  style,
  borderRadius = 'medium',
}) => {
  return (
    <StyledSurface
      $elevation={elevation}
      $borderRadius={borderRadius}
      style={style}
    >
      {children}
    </StyledSurface>
  );
};

export default Surface;
