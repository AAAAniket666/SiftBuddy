import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import auth from '@react-native-firebase/auth';

const PasswordResetScreen = React.memo(function PasswordResetScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);

  // Handle password reset
  const handleReset = async () => {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await auth().sendPasswordResetEmail(email);
      setInfo('Password reset email sent!');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={60}
      >
        <View style={styles.card}>
          <Text style={[styles.logo, { color: '#0EA5E9' }]}>ShiftBuddy</Text>
          <Text style={styles.subtitle}>Reset your password</Text>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.floatingLabel}>Email</Text>
            <TextInput
              placeholder={emailFocused ? '' : 'Email'}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              accessible 
              accessibilityLabel="Email address"
              style={styles.input}
            />
          </View>
          
          {info ? <Text style={styles.infoText}>{info}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          {loading ? (
            <ActivityIndicator color="#0369A1" style={styles.loading} />
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleReset} 
              accessibilityRole="button" 
              accessibilityLabel="Send reset email"
            >
              <Text style={styles.buttonText}>Send Reset Email</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
});

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FB923C',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#171717',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '400',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  floatingLabel: {
    position: 'absolute',
    left: 8,
    top: -10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    fontSize: 12,
    color: '#0369A1',
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#0369A1',
    borderRadius: 8,
    fontSize: 16,
    color: '#171717',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  infoText: {
    color: '#22C55E',
    marginBottom: 4,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loading: {
    marginVertical: 8,
  },
  button: {
    width: '100%',
    padding: 18,
    marginVertical: 8,
    borderRadius: 24,
    backgroundColor: '#0369A1',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#0369A1',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
});

export default PasswordResetScreen; 