import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { dark, brand } from '@/constants/Colors';

// Replace with your Google OAuth Client ID
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'cakeai' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSuccess(response.authentication?.accessToken);
    }
  }, [response]);

  async function handleGoogleSuccess(accessToken?: string | null) {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const userInfo = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await userInfo.json();
      await signIn({
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.picture,
        provider: 'google',
      });
    } catch {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAppleSignIn() {
    try {
      setIsLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const name = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() || 'User'
        : 'User';

      await signIn({
        id: credential.user,
        name,
        email: credential.email || '',
        provider: 'apple',
      });
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'Failed to sign in with Apple');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Dev-only quick sign in
  async function handleDevSignIn() {
    await signIn({
      id: 'dev-user',
      name: 'Dev User',
      email: 'dev@cakeai.app',
      provider: 'google',
    });
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0a2e', '#0A0A0F', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, { top: -80, right: -80, backgroundColor: 'rgba(255,107,107,0.08)' }]} />
      <View style={[styles.circle, { bottom: 100, left: -120, backgroundColor: 'rgba(78,205,196,0.06)' }]} />

      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[brand.gradient1, brand.gradient2]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoEmoji}>🍰</Text>
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Cake AI</Text>
          <Text style={styles.tagline}>Snap. Track. Thrive.</Text>
          <Text style={styles.description}>
            Take a photo of your food and instantly{'\n'}get detailed calorie & macro breakdowns
          </Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.authButtons}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.authButton, styles.appleButton]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <FontAwesome name="apple" size={20} color="#fff" />
              <Text style={styles.authButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.authButton, styles.googleButton]}
            onPress={() => promptAsync()}
            disabled={!request || isLoading}
          >
            <FontAwesome name="google" size={18} color="#fff" />
            <Text style={styles.authButtonText}>Continue with Google</Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity onPress={handleDevSignIn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
  },
  circle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 50,
  },
  logoArea: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: brand.primary,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    color: dark.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  authButtons: {
    gap: 14,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  appleButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  },
  googleButton: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  authButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  skipText: {
    fontSize: 15,
    color: dark.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
