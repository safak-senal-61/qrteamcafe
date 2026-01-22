import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { login } from '../../src/services/auth';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const router = useRouter();
  const { login: storeLogin } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin');
        return;
    }
    
    setLoading(true);
    try {
        const data = await login(email, password);
        // Backend'den dönen data: { accessToken, user: {...} } formatında olmalı
        // Eğer backend sadece token dönüyorsa user bilgisini decode etmek veya ayrı bir endpointten çekmek gerekir.
        // Şimdilik data.access_token ve data.user varsayıyoruz.
        
        await storeLogin(data.access_token, data.user || { email }); 
        router.back(); 
    } catch (error) {
        console.error(error);
        Alert.alert('Hata', 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Giriş Yap</Text>
      <Text style={styles.subtitle}>Sipariş vermek için giriş yapın</Text>

      <TextInput
          style={styles.input}
          placeholder="E-posta Adresi"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
      />
      <TextInput
          style={styles.input}
          placeholder="Şifre"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
      />
      
      <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
      >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/auth/register')}>
        <Text style={styles.linkText}>Hesabınız yok mu? Kayıt Olun</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
