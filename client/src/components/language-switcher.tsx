'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, {locale: newLocale});
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[130px] bg-background/50 backdrop-blur-sm border-primary/20 focus:ring-primary/20">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
        <SelectItem value="en">🇬🇧 English</SelectItem>
        <SelectItem value="ar">🇸🇦 العربية</SelectItem>
      </SelectContent>
    </Select>
  );
}
