import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import auth from '@react-native-firebase/auth';
import AnimatedButton from '../components/AnimatedButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const SignupScreen = React.memo(function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle email/password signup
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await auth().createUserWithEmailAndPassword(email, password);
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
        <Animated.View style={styles.card} entering={FadeInUp.delay(200).springify()}>
          <Animated.Text style={styles.logo} entering={FadeInDown.delay(100)}>
            ShiftBuddy
          </Animated.Text>
          <Animated.Text style={styles.subtitle} entering={FadeInDown.delay(150)}>
            Create your account
          </Animated.Text>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.floatingLabel}>Email</Text>
            <TextInput
              placeholder="Email"
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
          
          <View style={styles.inputWrapper}>
            <Text style={styles.floatingLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder={passwordFocused ? '' : '********'}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                accessible 
                accessibilityLabel="Password"
                style={styles.passwordInput}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.floatingLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder={confirmFocused ? '' : '********'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                textContentType="password"
                accessible 
                accessibilityLabel="Confirm password"
                style={styles.passwordInput}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          {loading ? (
            <ActivityIndicator color="#0369A1" style={styles.loading} />
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSignup} 
              accessibilityRole="button" 
              accessibilityLabel="Sign up"
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    color: '#0EA5E9',
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
    color: '#000',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0369A1',
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
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

export default SignupScreen; 