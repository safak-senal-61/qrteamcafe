import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Camera, Coffee, User } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
            <Coffee color="#000" size={40} />
        </View>
        <Text style={styles.title}>QR Team Cafe</Text>
        <Text style={styles.subtitle}>Lezzete hızlı ulaşın</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => alert('QR Okuma özelliği yakında!')}>
          <Camera color="#fff" size={24} />
          <Text style={styles.primaryButtonText}>QR Kod Okut</Text>
        </TouchableOpacity>

        <Link href="/menu/demo-cafe" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Coffee color="#333" size={24} />
            <Text style={styles.secondaryButtonText}>Örnek Menü</Text>
          </TouchableOpacity>
        </Link>
        
        <TouchableOpacity style={styles.outlineButton}>
            <User color="#333" size={24} />
            <Text style={styles.secondaryButtonText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});
