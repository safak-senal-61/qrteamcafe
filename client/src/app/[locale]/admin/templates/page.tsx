'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { Loader2, Check, LayoutTemplate, Palette, MonitorSmartphone } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'classic',
    name: 'Klasik Tema',
    description: 'Sade, anlaşılır ve kullanıcı dostu geleneksel menü tasarımı. Her türlü işletme için uygundur.',
    color: 'bg-slate-100',
    preview: (
      <div className="w-full h-32 relative overflow-hidden rounded-md border shadow-sm group">
         <img 
           src="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=600&auto=format&fit=crop" 
           alt="Classic" 
           className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
         />
         <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-2 rounded shadow-sm w-3/4 h-3/4 flex flex-col gap-2 opacity-90">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="flex gap-1">
                   <div className="h-12 bg-slate-100 rounded flex-1"></div>
                   <div className="h-12 bg-slate-100 rounded flex-1"></div>
                </div>
            </div>
         </div>
      </div>
    )
  },
  {
    id: 'modern',
    name: 'Modern Dark',
    description: 'Karanlık mod sevenler için şık, premium ve görsel odaklı modern tasarım.',
    color: 'bg-slate-950 text-white',
    preview: (
      <div className="w-full h-32 relative overflow-hidden rounded-md border border-slate-800 shadow-sm group bg-slate-950">
         <img 
           src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop" 
           alt="Modern" 
           className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-110"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent flex items-end p-3">
             <div className="w-full">
                <div className="h-6 w-2/3 bg-white/10 rounded mb-2 backdrop-blur-md"></div>
                <div className="flex gap-2">
                   <div className="h-10 w-1/3 bg-white/5 rounded backdrop-blur-md"></div>
                   <div className="h-10 w-1/3 bg-white/5 rounded backdrop-blur-md"></div>
                </div>
             </div>
         </div>
      </div>
    )
  },
  {
    id: 'minimal',
    name: 'Minimal Beyaz',
    description: 'Ferah, aydınlık ve tipografi odaklı tasarım. Kahve dükkanları ve pastaneler için ideal.',
    color: 'bg-white border',
    preview: (
      <div className="w-full h-32 relative overflow-hidden rounded-md border shadow-sm group bg-white">
         <div className="absolute top-0 left-0 right-0 h-12 border-b flex items-center justify-center bg-white z-10">
            <div className="h-3 w-1/3 bg-zinc-200 rounded-full"></div>
         </div>
         <div className="absolute top-12 bottom-0 left-0 right-0 p-3 flex flex-col gap-3 overflow-hidden">
             <div className="flex gap-2 overflow-hidden">
                <div className="h-6 w-16 bg-zinc-100 rounded-full flex-shrink-0"></div>
                <div className="h-6 w-16 bg-zinc-100 rounded-full flex-shrink-0"></div>
                <div className="h-6 w-16 bg-zinc-100 rounded-full flex-shrink-0"></div>
             </div>
             <div className="space-y-2">
                <div className="h-10 w-full border-b border-zinc-100 flex items-center justify-between">
                    <div className="h-2 w-1/2 bg-zinc-100 rounded"></div>
                    <div className="h-2 w-8 bg-zinc-100 rounded"></div>
                </div>
                <div className="h-10 w-full border-b border-zinc-100 flex items-center justify-between">
                    <div className="h-2 w-1/2 bg-zinc-100 rounded"></div>
                    <div className="h-2 w-8 bg-zinc-100 rounded"></div>
                </div>
             </div>
         </div>
      </div>
    )
  },
  {
    id: 'premium',
    name: 'Premium Gold',
    description: 'Lüks restoranlar ve oteller için siyah ve altın rengi detaylarla bezenmiş özel tasarım.',
    color: 'bg-neutral-900 text-amber-500',
    preview: (
      <div className="w-full h-32 relative overflow-hidden rounded-md border border-amber-900/30 shadow-sm group bg-[#0a0a0a]">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-amber-500">
             <div className="h-12 w-12 border border-amber-500/30 rounded-full flex items-center justify-center mb-2">
                 <div className="h-8 w-8 bg-amber-500/10 rounded-full"></div>
             </div>
             <div className="h-2 w-20 bg-amber-500/50 rounded-full"></div>
         </div>
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
      </div>
    )
  },
  {
    id: 'bistro',
    name: 'Bistro Kağıt',
    description: 'Dokulu kağıt arka plan, serif fontlar ve sıcak tonlarla samimi bir kafe/bistro atmosferi.',
    color: 'bg-[#f8f5e6] text-stone-800',
    preview: (
      <div className="w-full h-32 relative overflow-hidden rounded-md border border-stone-300 shadow-sm group bg-[#f8f5e6]">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-10"></div>
         <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=600&auto=format&fit=crop" 
               alt="Bistro" 
               className="w-full h-full object-cover sepia-[.3]" 
             />
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-[#f8f5e6] p-2 rounded-full border border-stone-800 shadow-sm">
                     <div className="h-3 w-3 bg-stone-800 rounded-full"></div>
                 </div>
             </div>
         </div>
         <div className="absolute bottom-0 left-0 right-0 h-1/2 p-2 flex flex-col gap-1 items-center justify-center">
             <div className="h-2 w-20 bg-stone-800 rounded-sm mb-1 opacity-80"></div>
             <div className="h-1 w-32 bg-stone-400 rounded-sm"></div>
         </div>
      </div>
    )
  }
];

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState('classic');
  const [cafeId, setCafeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        setCafeId(user.cafeId);

        const res = await fetch(`${API_URL}/cafes/${user.cafeId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.templateId) {
            setCurrentTemplate(data.templateId);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error('Ayarlar yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (templateId: string) => {
    if (!cafeId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (res.ok) {
        setCurrentTemplate(templateId);
        toast.success('Şablon başarıyla güncellendi.');
      } else {
        toast.error('Şablon güncellenemedi.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Şablon Yönetimi</h2>
        <p className="text-muted-foreground">
          Müşterilerinizin göreceği menü tasarımını buradan seçebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((template) => {
          const isSelected = currentTemplate === template.id;
          return (
            <Card key={template.id} className={`relative overflow-hidden transition-all hover:border-primary/50 ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : ''}`}>
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
              <CardHeader className={`${template.color} border-b h-40 flex items-center justify-center p-6`}>
                {template.preview}
              </CardHeader>
              <CardContent className="pt-6">
                <CardTitle className="mb-2 flex items-center gap-2">
                  {template.name}
                  {isSelected && <Badge variant="secondary" className="text-xs">Aktif</Badge>}
                </CardTitle>
                <CardDescription>
                  {template.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isSelected ? "outline" : "default"}
                  disabled={isSelected || saving}
                  onClick={() => handleSave(template.id)}
                >
                  {saving && !isSelected ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isSelected ? (
                    <span className="flex items-center"><Check className="mr-2 h-4 w-4" /> Seçili</span>
                  ) : (
                    <span className="flex items-center"><MonitorSmartphone className="mr-2 h-4 w-4" /> Bu Şablonu Seç</span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-primary/10 rounded-full">
                <Palette className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h3 className="font-semibold text-lg">Daha fazla kişiselleştirme mi lazım?</h3>
                <p className="text-muted-foreground text-sm">
                    Ayarlar sayfasından marka renginizi, logonuzu ve kapak görselinizi düzenleyerek seçtiğiniz şablonu markanıza uygun hale getirebilirsiniz.
                </p>
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/admin/settings'}>
                Ayarlara Git
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
