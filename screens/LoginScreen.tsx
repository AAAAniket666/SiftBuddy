import React, { useState } from 'react';
import { 
  View, 
  Text as RNText, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  Alert 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Button, Card, Input, LoadingSpinner, Divider } from '../components';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle email/password login
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e: any) {
      setError(e.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google SSO login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      
      if (signInResult.data?.idToken) {
        const googleCredential = auth.GoogleAuthProvider.credential(signInResult.data.idToken);
        await auth().signInWithCredential(googleCredential);
      } else {
        throw new Error('No ID token received from Google');
      }
    } catch (e: any) {
      if (e.code === 'SIGN_IN_CANCELLED') {
        // User cancelled - no error needed
      } else {
        const errorMsg = e.message || 'Google Sign-In failed';
        setError(errorMsg);
        Alert.alert('Google Sign-In Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={60}
      >
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.appLogo}>
              <RNText style={styles.logoText}>SB</RNText>
            </View>
            <View style={styles.centeredText}>
              <RNText style={[styles.appTitle, { color: '#0EA5E9' }]}>ShiftBuddy</RNText>
            </View>
            <View style={styles.centeredText}>
              <RNText style={styles.subtitle}>Your shift management companion</RNText>
            </View>
          </View>

          {/* Login Form */}
          <Card>
            <View style={styles.formContainer}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />

              <View style={{ position: 'relative' }}>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                secureTextEntry={!showPassword}
                textContentType="password"
                style={{ color: '#000' }}
              />
                <RNText
                  onPress={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 16, top: 36, fontSize: 20, color: '#888', padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </RNText>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <RNText style={styles.errorText}>{error}</RNText>
                </View>
              ) : null}

              <View style={styles.buttonContainer}>
                <Button onPress={handleLogin}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <View style={styles.buttonSpacer} />

                <Button onPress={() => navigation.navigate('PasswordReset')}>
                  Forgot Password?
                </Button>

                <Divider />

                <Button onPress={handleGoogleLogin}>
                  Continue with Google
                </Button>
              </View>
            </View>
          </Card>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Button onPress={() => navigation.navigate('Signup')}>
              Don't have an account? Sign Up
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      {loading && <LoadingSpinner />}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  centeredText: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    paddingVertical: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
  buttonSpacer: {
    height: 12,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoginScreen;
