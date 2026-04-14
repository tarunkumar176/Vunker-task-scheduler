import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const { theme, mode } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter email and password');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/home');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <View style={[styles.logo, { backgroundColor: theme.primary }]}>
              <Ionicons name="calendar" size={40} color="#FFF" />
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>Vynker Scheduler</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Manage tasks, projects & renewals</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={email} onChangeText={setEmail}
                placeholder="your@email.com" placeholderTextColor={theme.disabled}
                keyboardType="email-address" autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>PASSWORD</Text>
              <View style={[styles.passWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.passInput, { color: theme.text }]}
                  value={password} onChangeText={setPassword}
                  placeholder="Enter password" placeholderTextColor={theme.disabled}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleLogin} disabled={loading} activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkWrap}>
              <Text style={[styles.link, { color: theme.textSecondary }]}>
                Don't have an account? <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { fontSize: 13, marginTop: 4 },
  form: { gap: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 15 },
  passWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 4 },
  passInput: { flex: 1, fontSize: 15, paddingVertical: 9 },
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  linkWrap: { alignItems: 'center', marginTop: 8 },
  link: { fontSize: 14 },
});
