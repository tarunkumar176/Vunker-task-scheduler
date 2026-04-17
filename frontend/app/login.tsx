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
    if (!email.trim() || !password.trim()) { Alert.alert('Missing Fields', 'Please enter email and password'); return; }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/home' as any);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoStack}>
              <View style={[styles.logoShadow3, { backgroundColor: theme.primaryDark + '30' }]} />
              <View style={[styles.logoShadow2, { backgroundColor: theme.primaryDark + '60' }]} />
              <View style={[styles.logoShadow1, { backgroundColor: theme.primaryDark }]} />
              <View style={[styles.logoFace, { backgroundColor: theme.primary }]}>
                <Ionicons name="grid" size={36} color="#FFF" />
              </View>
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>Vynker</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Tasks · Projects · Renewals</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={[styles.cardInner, { borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Sign In</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Welcome back! Enter your details</Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="mail-outline" size={18} color={theme.primary} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: theme.text }]} value={email} onChangeText={setEmail}
                    placeholder="your@email.com" placeholderTextColor={theme.disabled}
                    keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>PASSWORD</Text>
                <View style={[styles.inputWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.primary} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: theme.text }]} value={password} onChangeText={setPassword}
                    placeholder="Enter password" placeholderTextColor={theme.disabled} secureTextEntry={!showPass} />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.btnStack}>
                <View style={[styles.btnShadow, { backgroundColor: theme.primaryDark }]} />
                <TouchableOpacity style={[styles.btn, { backgroundColor: loading ? theme.primaryLight : theme.primary }]}
                  onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
                  {loading
                    ? <Text style={styles.btnText}>Signing in... (may take ~30s)</Text>
                    : <><Ionicons name="arrow-forward-circle" size={22} color="#FFF" /><Text style={styles.btnText}>Sign In</Text></>}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.push('/register' as any)} style={styles.linkWrap}>
                <Text style={[styles.link, { color: theme.textSecondary }]}>
                  New here? <Text style={{ color: theme.primary, fontWeight: '800' }}>Create Account →</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 36 },
  logoStack: { width: 80, height: 80, marginBottom: 16, position: 'relative' },
  logoShadow3: { position: 'absolute', width: 80, height: 80, borderRadius: 22, top: 8, left: 8 },
  logoShadow2: { position: 'absolute', width: 80, height: 80, borderRadius: 22, top: 5, left: 5 },
  logoShadow1: { position: 'absolute', width: 80, height: 80, borderRadius: 22, top: 3, left: 3 },
  logoFace: { position: 'absolute', width: 80, height: 80, borderRadius: 22, justifyContent: 'center', alignItems: 'center', top: 0, left: 0 },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  tagline: { fontSize: 13, marginTop: 4, letterSpacing: 0.5 },
  card: { borderRadius: 24, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 24, elevation: 16 },
  cardInner: { borderRadius: 24, borderWidth: 1, padding: 24, gap: 16 },
  cardTitle: { fontSize: 24, fontWeight: '800' },
  cardSub: { fontSize: 14, marginTop: -8 },
  field: { gap: 8 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 13 },
  eyeBtn: { padding: 4 },
  btnStack: { position: 'relative', height: 54, marginTop: 4 },
  btnShadow: { position: 'absolute', bottom: -4, left: 4, right: -4, height: 54, borderRadius: 16 },
  btn: { position: 'absolute', top: 0, left: 0, right: 0, height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  linkWrap: { alignItems: 'center' },
  link: { fontSize: 14 },
});
