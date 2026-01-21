'use client';

import { motion, Variants } from 'framer-motion';
import { Users, Target, Heart, Coffee } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
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

  const stats = [
    { label: 'Mutlu Müşteri', value: '500+' },
    { label: 'Aktif Menü', value: '1000+' },
    { label: 'Aylık Sipariş', value: '50K+' },
    { label: 'Şehir', value: '20+' },
  ];

  return (
    <div className="min-h-screen bg-background py-12 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-16 lg:space-y-24"
        >
          {/* Hero Section */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <motion.h1 variants={itemVariants} className="text-3xl md:text-6xl font-bold tracking-tight">
              Biz Kimiz? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Teknoloji ve Lezzetin Buluşması
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-xl leading-relaxed">
              QR Team Cafe, restoran ve kafe işletmeciliğini dijitalleştirmek, operasyonları kolaylaştırmak ve müşteri deneyimini mükemmelleştirmek amacıyla kurulmuş bir teknoloji şirketidir.
            </motion.p>
          </div>

          {/* Stats Grid */}
          <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center p-6 rounded-2xl bg-secondary/30 border border-border/50"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex p-3 rounded-xl bg-purple-100 text-purple-600">
                <Target className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold">Misyonumuz</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                İşletmelerin dijital dönüşümünü hızlandırarak, onların asıl işleri olan "lezzet yaratmaya" odaklanmalarını sağlamak. Teknolojiyi karmaşık bir yük olmaktan çıkarıp, işlerini büyüten bir araç haline getirmek.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex p-3 rounded-xl bg-green-100 text-green-600">
                <Heart className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold">Değerlerimiz</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Şeffaflık, yenilikçilik ve müşteri odaklılık. Her bir satır kodumuzda ve her bir müşteri görüşmemizde bu değerleri yaşatıyoruz. Başarımızın sırrı, müşterilerimizin başarısıdır.
              </p>
            </motion.div>
          </div>

          {/* Team Section Placeholder */}
          <motion.div variants={itemVariants} className="text-center space-y-8">
             <div className="inline-flex p-3 rounded-xl bg-orange-100 text-orange-600 mb-4">
                <Users className="h-8 w-8" />
             </div>
             <h2 className="text-3xl font-bold">Ekibimiz</h2>
             <p className="text-muted-foreground max-w-2xl mx-auto">
                Yazılım mühendisleri, tasarımcılar ve sektör uzmanlarından oluşan tutkulu bir ekibiz. 
                Sizin için en iyisini üretmek için buradayız.
             </p>
             {/* Team members would go here */}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
