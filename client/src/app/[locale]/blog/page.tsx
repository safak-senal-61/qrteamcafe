'use client';

import { motion, Variants } from 'framer-motion';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BlogPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const posts = [
    {
      title: 'Restoran Otomasyonunda Yeni Trendler: 2024 Rehberi',
      excerpt: 'Yapay zeka, temassız ödeme ve dijital menülerin yükselişi. İşletmenizi geleceğe hazırlamak için bilmeniz gerekenler.',
      date: '15 Ocak 2024',
      author: 'Deniz Yılmaz',
      category: 'Teknoloji',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Müşteri Sadakatini Artırmanın 5 Altın Kuralı',
      excerpt: 'Sadık müşteriler yaratmak sadece lezzetli yemeklerle olmaz. Dijital araçları kullanarak müşterilerinizi nasıl geri kazanırsınız?',
      date: '10 Ocak 2024',
      author: 'Ayşe Demir',
      category: 'Pazarlama',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'QR Menü Kullanımının Ciroya Etkisi',
      excerpt: 'Verilerle konuşuyoruz: QR menü kullanan işletmelerin ortalama sipariş tutarı neden %20 daha yüksek?',
      date: '5 Ocak 2024',
      author: 'Mehmet Kaya',
      category: 'Analiz',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-16"
        >
          <div className="text-center space-y-4">
            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight">
              Blog & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                İçgörüler
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sektörel haberler, ipuçları ve başarı hikayeleri. İşletmenizi büyütmek için ihtiyacınız olan bilgiler burada.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group flex flex-col rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all h-full"
              >
                <div className="relative h-48 overflow-hidden bg-muted">
                  {/* Placeholder for actual Next.js Image usage with real local assets or configured domains */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col space-y-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                    <Link href="#">{post.title}</Link>
                  </h3>
                  
                  <p className="text-muted-foreground text-sm line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <Button variant="ghost" className="w-fit p-0 h-auto hover:bg-transparent hover:text-primary font-semibold group/btn">
                    Devamını Oku <ArrowRight className="ml-2 h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
