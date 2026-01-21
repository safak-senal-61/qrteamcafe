'use client';

import { motion, Variants } from 'framer-motion';
import { Briefcase, Code, Terminal, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CareersPage() {
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

  const positions = [
    {
      title: 'Senior Frontend Developer',
      type: 'Tam Zamanlı',
      location: 'İstanbul / Hibrit',
      department: 'Engineering',
      icon: <Code className="h-6 w-6" />
    },
    {
      title: 'Backend Developer (Go/Node.js)',
      type: 'Tam Zamanlı',
      location: 'Uzaktan',
      department: 'Engineering',
      icon: <Terminal className="h-6 w-6" />
    },
    {
      title: 'Product Manager',
      type: 'Tam Zamanlı',
      location: 'İstanbul',
      department: 'Product',
      icon: <Briefcase className="h-6 w-6" />
    },
    {
      title: 'Digital Marketing Specialist',
      type: 'Tam Zamanlı',
      location: 'İstanbul / Hibrit',
      department: 'Marketing',
      icon: <Megaphone className="h-6 w-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-16"
        >
          <div className="text-center space-y-4">
            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight">
              Kariyer <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Fırsatları
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Büyük işler başarmak isteyen, tutkulu ve yetenekli ekip arkadaşları arıyoruz.
              Geleceği birlikte inşa edelim.
            </motion.p>
          </div>

          <div className="grid gap-6">
            {positions.map((job, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ x: 10 }}
                className="group flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="p-4 rounded-xl bg-secondary/50 text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {job.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-secondary">{job.department}</span>
                      <span>•</span>
                      <span>{job.type}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 w-full md:w-auto">
                   <Button variant="outline" className="w-full md:w-auto rounded-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                      Başvur
                   </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemVariants} className="text-center p-8 rounded-3xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
             <h3 className="text-2xl font-bold mb-4">Aradığın Pozisyonu Bulamadın mı?</h3>
             <p className="text-muted-foreground mb-6">
                Genel başvurulara her zaman açığız. CV'ni bize gönder, uygun bir pozisyon açıldığında ilk seninle iletişime geçelim.
             </p>
             <Button size="lg" className="rounded-full font-bold">
                Genel Başvuru Yap
             </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
