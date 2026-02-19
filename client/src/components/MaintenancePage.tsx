'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Clock, AlertTriangle, Send, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function MaintenancePage() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch(`${API_URL}/contact-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });

      if (!response.ok) throw new Error('Failed');
      
      setStatus('success');
      setTimeout(() => {
        setShowForm(false);
        setStatus('idle');
        setEmail('');
        setMessage('');
      }, 3000);
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="bg-indigo-600 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.2] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative bg-white/20 p-4 rounded-full backdrop-blur-sm ring-4 ring-white/10">
            <Wrench className="h-10 w-10 text-white" />
          </div>
        </div>
        
        <div className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Bakım Modu
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Sistem şu anda güncelleniyor
            </p>
          </div>
          
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Sizlere daha iyi hizmet verebilmek için altyapımızı güçlendiriyoruz. Lütfen kısa bir süre sonra tekrar deneyiniz.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="font-medium">Tahmini Süre: 1-2 Saat</span>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800">
          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.div
                key="text"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-center"
              >
                <p className="text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-1">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Acil durumlar için
                  </span>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-1"
                  >
                    destek ekibimizle iletişime geçebilirsiniz.
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Destek Talebi</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="text-slate-400 hover:text-slate-500"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>

                {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-4 text-green-600 gap-2">
                    <CheckCircle className="h-8 w-8" />
                    <span className="text-sm font-medium">Mesajınız iletildi!</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="E-posta adresiniz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <textarea
                        required
                        placeholder="Mesajınız..."
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                    {status === 'error' && (
                      <p className="text-xs text-red-500 text-center">Bir hata oluştu. Lütfen tekrar deneyin.</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Gönder
                    </button>
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
