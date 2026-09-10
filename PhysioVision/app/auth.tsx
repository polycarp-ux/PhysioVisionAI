import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DEMO_AUTH_ENABLED, login, register } from '../utils/api';

export default function AuthScreen() {
  const router = useRouter();

  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || (!DEMO_AUTH_ENABLED && password.length < 6)) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }

    if (registering && !name.trim()) {
      setError('Enter your name.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (registering) {
        await register(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }

      router.replace('/onboarding');
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/auth-logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="PhysioVision logo"
      />
      <Text style={styles.title}>PhysioVision AI</Text>
      <Text style={styles.subtitle}>
        {registering ? 'Create your account' : 'Sign in to continue'}
      </Text>

      {registering && (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#777"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#777"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={() => void submit()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0a0a0a" />
        ) : (
          <Text style={styles.buttonText}>
            {registering ? 'Create account' : 'Sign in'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setRegistering((value) => !value);
          setError('');
        }}
      >
        <Text style={styles.switchText}>
          {registering
            ? 'Already have an account? Sign in'
            : 'New user? Create an account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#0a0a0a',
  },
  logo: {
    width: 76,
    height: 76,
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  input: {
    color: '#fff',
    backgroundColor: '#171717',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#00d4aa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0a0a0a',
    fontWeight: '800',
    fontSize: 16,
  },
  switchText: {
    color: '#00d4aa',
    textAlign: 'center',
    marginTop: 20,
  },
});