import React from 'react';
import { Text as RNText, TouchableOpacity, View, TextInput } from 'react-native';

// Temporary simple components to fix build errors

export const Text: React.FC<any> = ({ variant, color, children, style, ...props }) => (
  <RNText style={[{ fontSize: 16, color: '#000' }, style]} {...props}>
    {children}
  </RNText>
);

export const Button: React.FC<any> = ({ children, style, ...props }) => (
  <TouchableOpacity 
    style={[{
      backgroundColor: '#0EA5E9',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    }, style]} 
    {...props}
  >
    <RNText style={{ color: 'white', fontWeight: '600' }}>{children}</RNText>
  </TouchableOpacity>
);

export const Card: React.FC<any> = ({ children, style, ...props }) => (
  <View 
    style={[{
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }, style]} 
    {...props}
  >
    {children}
  </View>
);

export const Input: React.FC<any> = ({ label, style, ...props }) => (
  <View style={{ marginBottom: 16 }}>
    {label && (
      <RNText style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
        {label}
      </RNText>
    )}
    <TextInput
      style={[{
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: 'white',
      }, style]}
      {...props}
    />
  </View>
);

export const LoadingSpinner: React.FC<any> = ({ style, ...props }) => (
  <View style={[{ padding: 20, alignItems: 'center' }, style]} {...props}>
    <RNText>Loading...</RNText>
  </View>
);

export const Divider: React.FC<any> = ({ style, ...props }) => (
  <View 
    style={[{
      height: 1,
      backgroundColor: '#E5E5E5',
      marginVertical: 8,
    }, style]} 
    {...props}
  />
);
