import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, SectionList, ActivityIndicator, TouchableOpacity, ScrollView, Animated, SectionListData } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCafeBySlug, getCafeCategories, getCafeProducts } from '../../src/services/menu';
import { Cafe, Category, Product } from '../../src/types';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../src/store/auth';
import { LogOut, User } from 'lucide-react-native';

export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const sectionListRef = useRef<SectionList<Product, Category>>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      // 1. Cafe bilgisini çek
      const cafeData = await getCafeBySlug(id);
      setCafe(cafeData);

      // 2. Kategorileri çek (Zaman bazlı sıralanmış olarak gelir)
      const categoriesData = await getCafeCategories(cafeData.id);
      
      // 3. Ürünleri çek (API ayrı endpoint ise)
      // Bizim mock yapıda kategorilerin içinde ürünler var, ama API'de ayrı olabilir.
      // src/services/menu.ts içindeki getCafeCategories zaten birleştirilmiş dönecek şekilde ayarlandıysa sorun yok.
      // Eğer API ayrı dönüyorsa burada birleştirme yapılabilir.
      // Şimdilik servisin doğru formatta döndüğünü varsayıyoruz.
      
      setCategories(categoriesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToCategory = (index: number) => {
    sectionListRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        viewOffset: 100, // Header yüksekliği kadar offset
        animated: true,
    });
    setActiveCategory(categories[index].id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!cafe) {
    return (
      <View style={styles.container}>
        <Text>Kafe bulunamadı.</Text>
      </View>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => { /* Ürün detayına git */ }}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        {item.description && <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>}
        <Text style={styles.productPrice}>{item.price} ₺</Text>
      </View>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: SectionListData<Product, Category> }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Category Filter Bar */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat, index) => (
                <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.categoryChip, activeCategory === cat.id && styles.activeCategoryChip]}
                    onPress={() => scrollToCategory(index)}
                >
                    <Text style={[styles.categoryChipText, activeCategory === cat.id && styles.activeCategoryChipText]}>
                        {cat.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      <SectionList
        ref={sectionListRef}
        sections={categories.map(cat => ({ ...cat, data: cat.products || [] }))}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image 
                source={{ uri: cafe.coverImageUrl }} 
                style={styles.coverImage}
            />
            <View style={styles.overlay} />
            
            {/* Login/User Button - Top Right */}
            <View style={styles.topBar}>
                 {isAuthenticated ? (
                     <TouchableOpacity style={styles.authButton} onPress={logout}>
                         <LogOut color="#fff" size={20} />
                         <Text style={styles.authButtonText}>Çıkış</Text>
                     </TouchableOpacity>
                 ) : (
                     <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth/login')}>
                         <User color="#fff" size={20} />
                         <Text style={styles.authButtonText}>Giriş Yap</Text>
                     </TouchableOpacity>
                 )}
            </View>

            <View style={styles.headerContent}>
                {cafe.logoUrl && (
                    <Image source={{ uri: cafe.logoUrl }} style={styles.logo} />
                )}
                <Text style={styles.cafeName}>{cafe.name}</Text>
                <Text style={styles.cafeAddress}>Lezzetli anlar için...</Text>
            </View>
          </View>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  header: {
    height: 250,
    position: 'relative',
    marginBottom: 0,
    justifyContent: 'flex-end',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBar: {
    position: 'absolute',
    top: 40, // Safe area approx
    right: 20,
    zIndex: 10,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  authButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  headerContent: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 10,
  },
  cafeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  cafeAddress: {
    fontSize: 14,
    color: '#eee',
    marginTop: 4,
  },
  categoryBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeCategoryChip: {
    backgroundColor: '#000',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: '#fff',
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
});
