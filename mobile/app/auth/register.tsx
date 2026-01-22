import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { register } from '../../src/services/auth';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Hata', 'Lütfen zorunlu alanları (Ad, E-posta, Şifre) doldurun');
      return;
    }

    if (password.length < 6) {
        Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
        return;
    }

    setLoading(true);
    try {
      await register({ name, phone, email, password });
      Alert.alert('Başarılı', 'Kayıt başarılı! Lütfen giriş yapın.', [
        { text: 'Tamam', onPress: () => router.replace('/auth/login') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Kayıt yapılamadı. E-posta adresi kullanılıyor olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Kayıt Ol</Text>
      <Text style={styles.subtitle}>Lezzetli anlara hemen katılın</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Telefon (İsteğe bağlı)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre (En az 6 karakter)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kayıt Ol</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş Yapın</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#000',
    textDecorationLine: 'underline',
  },
});
