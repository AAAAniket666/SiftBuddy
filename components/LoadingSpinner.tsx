import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import styled from 'styled-components/native';
import theme from '../theme';

interface LoadingSpinnerProps extends ActivityIndicatorProps {
  variant?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
}

const Container = styled.View<{ $overlay: boolean }>`
  ${props => props.$overlay ? `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    justify-content: center;
    align-items: center;
    z-index: 1000;
  ` : `
    justify-content: center;
    align-items: center;
  `}
`;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'small',
  color = theme.colors.primary[500],
  overlay = false,
  ...activityIndicatorProps
}) => {
  const size = variant === 'large' ? 'large' : 'small';

  return (
    <Container $overlay={overlay}>
      <ActivityIndicator
        size={size}
        color={color}
        {...activityIndicatorProps}
      />
    </Container>
  );
};

export default LoadingSpinner;
