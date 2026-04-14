import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Register() {
  const router = useRouter();
  const { register, loading } = useAuthStore();
  const { theme, mode } = useThemeStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.replace('/home');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Start managing your work smarter</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>FULL NAME</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={theme.disabled} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={theme.disabled}
                keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>PASSWORD</Text>
              <View style={[styles.passWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput style={[styles.passInput, { color: theme.text }]}
                  value={password} onChangeText={setPassword} placeholder="Min 6 characters"
                  placeholderTextColor={theme.disabled} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkWrap}>
              <Text style={[styles.link, { color: theme.textSecondary }]}>
                Already have an account? <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign In</Text>
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
  content: { flexGrow: 1, padding: 24 },
  back: { marginBottom: 24, marginTop: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 32 },
  form: { gap: 16 },
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
