'use client';

import { motion, Variants } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import LottieAnimation from '@/components/ui/LottieAnimation';
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('ContactPage');

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-background/50 via-background to-background" />
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-10 lg:mb-16 space-y-4 lg:space-y-6">
            <motion.div variants={itemVariants} className="inline-block">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
                {t('badge')}
              </span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-3xl md:text-6xl font-bold tracking-tight">
              {t('title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                {t('titleHighlight')}
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('subtitle')}
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            {/* Contact Info Side */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="relative">
                 {/* Decorative Lottie */}
                <div className="w-full h-64 mb-8 bg-secondary/30 rounded-3xl flex items-center justify-center overflow-hidden border border-border/50">
                    <LottieAnimation url="https://assets2.lottiefiles.com/packages/lf20_u25cckyh.json" height="120%" width="120%" />
                </div>

                <div className="grid gap-6">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{t('emailTitle')}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{t('emailDesc')}</p>
                        <a href="mailto:info@qrteamcafe.com" className="text-foreground font-medium hover:text-primary transition-colors">
                          info@qrteamcafe.com
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{t('phoneTitle')}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{t('phoneDesc')}</p>
                        <a href="tel:+908501234567" className="text-foreground font-medium hover:text-primary transition-colors">
                          +90 (850) 123 45 67
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-green-500/10 text-green-600">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{t('officeTitle')}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{t('officeDesc')}</p>
                        <p className="text-foreground font-medium" dangerouslySetInnerHTML={{ __html: t.raw('address') }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>

            {/* Contact Form Side */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-600" />
                <CardContent className="p-8 md:p-10">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    {t('formTitle')}
                  </h2>
                  
                  <form className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('formName')}</Label>
                        <Input id="name" placeholder="John Doe" className="bg-background/50 border-border/50 focus:border-primary transition-colors h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('formEmail')}</Label>
                        <Input id="email" type="email" placeholder="john@example.com" className="bg-background/50 border-border/50 focus:border-primary transition-colors h-12" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('formSubject')}</Label>
                      <Input id="subject" placeholder={t('formSubjectPlaceholder')} className="bg-background/50 border-border/50 focus:border-primary transition-colors h-12" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('formMessage')}</Label>
                      <Textarea 
                        id="message" 
                        placeholder={t('formMessagePlaceholder')} 
                        className="min-h-[150px] resize-none bg-background/50 border-border/50 focus:border-primary transition-colors"
                      />
                    </div>

                    <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                      {t('formSubmit')} <Send className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* FAQ Preview or Extra Info */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{t('quickResponse')}</p>
                    <p className="text-xs text-muted-foreground">{t('avgTime')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">{t('globalSupport')}</p>
                    <p className="text-xs text-muted-foreground">{t('languages')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
