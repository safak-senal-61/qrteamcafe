'use client';

import React from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle2, XCircle, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/navigation';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Güvenlik Merkezi
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Hesabınızın ve verilerinizin güvenliği bizim için en öncelikli konudur. İşte güvenliğinizi sağlamak için bilmeniz gerekenler.
          </p>
        </div>

        {/* Critical Warning - Self XSS */}
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-700 dark:text-red-400">ÖNEMLİ UYARI: Tarayıcı Konsolu Dolandırıcılığı</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-800 dark:text-slate-200">
              Eğer birisi size <strong>&quot;Bu kodu konsola yapıştırırsan qrders&apos;in gizli özelliklerini açarsın&quot;</strong> veya 
              <strong>&quot;Hesabını kurtarmak için şunu yapıştır&quot;</strong> dediyse, lütfen <strong>DURUN!</strong>
            </p>
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
              <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Self-XSS (Kendi Kendine Siteler Arası Komut Çalıştırma) Nedir?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Bu, saldırganların sizi kandırarak tarayıcınızın geliştirici konsoluna zararlı kod yapıştırmanızı sağladığı bir saldırı türüdür. 
                Bu kodu yapıştırdığınızda, saldırganlar hesabınıza tam erişim sağlayabilir, verilerinizi çalabilir veya sizin adınıza işlemler yapabilir.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>Asla anlamadığınız bir kodu tarayıcı konsoluna yapıştırmayın.</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-indigo-600" />
                <CardTitle>Hesap Güvenliği</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Şifreniz en az 8 karakter uzunluğunda olmalı ve büyük/küçük harf, rakam içermelidir.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Şifrenizi başka sitelerde kullandığınız şifrelerle aynı yapmayın.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Halka açık bilgisayarlarda (internet kafe vb.) &quot;Beni Hatırla&quot; seçeneğini kullanmayın.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Phishing Warning */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-indigo-600" />
                <CardTitle>Oltalama (Phishing) Girişimleri</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                qrders çalışanları sizden asla şifrenizi, kredi kartı bilgilerinizi veya SMS doğrulama kodunuzu istemez.
              </p>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Resmi Alan Adlarımız:</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    qrders.com.tr
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    api.qrders.com.tr
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                Adres çubuğunda kilit simgesinin (SSL sertifikası) olduğundan emin olun.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact / Report */}
        <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Şüpheli bir durum mu var?</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md">
                Hesabınızın ele geçirildiğini düşünüyorsanız veya bir güvenlik açığı bulduysanız hemen bizimle iletişime geçin.
              </p>
            </div>
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
              <Link href="mailto:guvenlik@qrders.com.tr">
                <Mail className="mr-2 h-4 w-4" />
                Bize Bildirin
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
