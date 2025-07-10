import React from 'react';
import { ViewStyle } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  style?: ViewStyle;
  margin?: number;
}

const HorizontalDivider = styled.View<{
  $thickness: number;
  $color: string;
  $margin: number;
}>`
  height: ${props => props.$thickness}px;
  background-color: ${props => props.$color};
  width: 100%;
  margin-vertical: ${props => props.$margin}px;
`;

const VerticalDivider = styled.View<{
  $thickness: number;
  $color: string;
  $margin: number;
}>`
  width: ${props => props.$thickness}px;
  background-color: ${props => props.$color};
  height: 100%;
  margin-horizontal: ${props => props.$margin}px;
`;

const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color = theme.colors.outline,
  style,
  margin = 0,
}) => {
  if (orientation === 'vertical') {
    return (
      <VerticalDivider
        $thickness={thickness}
        $color={color}
        $margin={margin}
        style={style}
      />
    );
  }

  return (
    <HorizontalDivider
      $thickness={thickness}
      $color={color}
      $margin={margin}
      style={style}
    />
  );
};

export default Divider;
