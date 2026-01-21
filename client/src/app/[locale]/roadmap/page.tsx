'use client';

import { motion, Variants } from 'framer-motion';
import { Milestone, Rocket, Star, Code } from 'lucide-react';

export default function RoadmapPage() {
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
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const milestones = [
    {
      quarter: '2024 Q1',
      title: 'Başlangıç',
      icon: <Rocket className="h-6 w-6" />,
      items: ['QR Menü Lansmanı', 'Temel Yönetim Paneli', 'Çoklu Dil Desteği'],
      status: 'completed'
    },
    {
      quarter: '2024 Q2',
      title: 'Büyüme',
      icon: <Code className="h-6 w-6" />,
      items: ['POS Entegrasyonları', 'Stok Takibi Modülü', 'Garson Çağrı Sistemi'],
      status: 'in-progress'
    },
    {
      quarter: '2024 Q3',
      title: 'Gelişme',
      icon: <Star className="h-6 w-6" />,
      items: ['Yapay Zeka Destekli Öneriler', 'Sadakat Programı', 'Mobil Uygulama'],
      status: 'planned'
    },
    {
      quarter: '2024 Q4',
      title: 'Global',
      icon: <Milestone className="h-6 w-6" />,
      items: ['Yurt Dışı Açılımı', 'Pazaryeri Entegrasyonu', 'Gelişmiş API'],
      status: 'planned'
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto space-y-16"
        >
          <div className="text-center space-y-4">
            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight">
              Yol <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Haritası
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Geleceği şimdiden inşa ediyoruz. İşte planlarımız ve hedeflerimiz.
            </motion.p>
          </div>

          <div className="relative border-l-2 border-border ml-4 md:ml-0 md:pl-8 space-y-12">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative pl-8 md:pl-0"
              >
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-background ${
                  milestone.status === 'completed' ? 'bg-green-500' :
                  milestone.status === 'in-progress' ? 'bg-primary animate-pulse' : 'bg-muted'
                } md:-left-[41px]`} />

                <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                  <div className="md:w-32 flex-shrink-0 pt-1">
                    <span className="font-bold text-primary">{milestone.quarter}</span>
                    <div className={`text-xs uppercase font-semibold mt-1 px-2 py-0.5 rounded-full w-fit ${
                      milestone.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                      milestone.status === 'in-progress' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {milestone.status === 'completed' ? 'Tamamlandı' :
                       milestone.status === 'in-progress' ? 'Sürüyor' : 'Planlandı'}
                    </div>
                  </div>

                  <div className="flex-1 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-secondary text-foreground">
                        {milestone.icon}
                      </div>
                      <h3 className="text-xl font-bold">{milestone.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {milestone.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-foreground/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
