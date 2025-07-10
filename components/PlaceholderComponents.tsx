import React from 'react';
import { View } from 'react-native';

// Placeholder components - to be implemented later
export const Avatar: React.FC<any> = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

export const Badge: React.FC<any> = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

export const BottomSheet: React.FC<any> = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

export const Switch: React.FC<any> = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

export const Chip: React.FC<any> = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

export default {
  Avatar,
  Badge,
  BottomSheet,
  Switch,
  Chip,
};
