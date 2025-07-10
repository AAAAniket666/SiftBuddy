import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemeProvider } from 'styled-components/native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import ProfileScreen from './screens/ProfileScreen';
import CalendarScreen from './screens/CalendarScreen';
import SwapInboxScreen from './screens/SwapInboxScreen';
import SwapDetailScreen from './screens/SwapDetailScreen';
import { addUser } from './screens/firestoreHelpers';
import { requestNotificationPermissionAndToken, onForegroundNotification } from './firebaseFCM';
import { initializeNotifications, setForegroundNotificationHandler } from './notificationHelper';
import NotificationPreferencesScreen from './screens/NotificationPreferencesScreen';
import NotificationHistoryScreen from './screens/NotificationHistoryScreen';
import FlashMessage from 'react-native-flash-message';
import AnalyticsScreen from './screens/AnalyticsScreen';
import AnimatedTabBar from './components/AnimatedTabBar';
import AnimatedLoading from './components/AnimatedLoading';

// Temporary basic theme for styled-components compatibility
const basicTheme = {
  background: '#FAFAFA',
  colors: {
    primary: '#0EA5E9',
    text: '#171717',
  },
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom tab bar component
const CustomTabBar = (props: any) => <AnimatedTabBar {...props} />;

// MainTabs: Bottom tab navigator for Calendar, Swaps, and Profile
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={CustomTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Swaps" component={SwapInboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main app entry point
export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '101294785949-9krap0dorf412e7c7cdgh6jgno0mq79a.apps.googleusercontent.com',
      offlineAccess: false,
    });
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        // Add user to Firestore if not already present
        await addUser({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
        });
      }
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    // Request notification permission and save FCM token
    requestNotificationPermissionAndToken().then(token => {
      if (token) {
        setFcmToken(token); // Save token to state for debug display
        console.log('FCM Token:', token); // Debug log
        // Save FCM token to Firestore if user is logged in
        const currentUser = auth().currentUser;
        if (currentUser && currentUser.uid) {
          import('@react-native-firebase/firestore').then(({ default: firestore }) => {
            firestore()
              .collection('users')
              .doc(currentUser.uid)
              .get()
              .then(doc => {
                const existingToken = doc.exists ? doc.data()?.fcmToken : null;
                if (existingToken !== token) {
                  firestore().collection('users').doc(currentUser.uid).update({ fcmToken: token });
                }
              });
          });
        }
      }
    });
    // Listen for foreground notifications
    const unsubscribe = onForegroundNotification(remoteMessage => {
      console.log('Foreground FCM message:', remoteMessage); // Debug log
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    initializeNotifications();
    setForegroundNotificationHandler();
  }, []);

  if (initializing) {
    // Show animated loading indicator while checking auth
    return <AnimatedLoading fcmToken={fcmToken} />;
  }

  return (
    <ThemeProvider theme={basicTheme}>
      <View style={styles.appContainer}>
        <NavigationContainer>
          {user ? (
            <Stack.Navigator 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 300,
              }}
            >
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen 
                name="SwapDetail" 
                component={SwapDetailScreen}
                options={{
                  animation: 'slide_from_bottom',
                  animationDuration: 400,
                }}
              />
              <Stack.Screen 
                name="NotificationPreferences" 
                component={NotificationPreferencesScreen}
                options={{
                  animation: 'slide_from_right',
                  animationDuration: 300,
                }}
              />
              <Stack.Screen 
                name="NotificationHistory" 
                component={NotificationHistoryScreen}
                options={{
                  animation: 'slide_from_right',
                  animationDuration: 300,
                }}
              />
              <Stack.Screen 
                name="AnalyticsScreen" 
                component={AnalyticsScreen}
                options={{
                  animation: 'slide_from_right',
                  animationDuration: 300,
                }}
              />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator 
              initialRouteName="Login" 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 300,
              }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
        <FlashMessage position="top" />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
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
  appTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
  },
  debugLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#525252',
  },
  debugTokenText: {
    marginTop: 4,
  },
  debugToken: {
    fontSize: 12,
    color: '#A3A3A3',
  },
});
