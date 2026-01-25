'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const languages = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full shadow-sm bg-background/60 backdrop-blur-md border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 gap-2 min-w-[90px]"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase font-medium tracking-wide">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              locale === lang.code && "bg-primary/10 text-primary font-medium"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{lang.flag}</span>
              {lang.label}
            </span>
            {locale === lang.code && <Check className="h-3 w-3" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
