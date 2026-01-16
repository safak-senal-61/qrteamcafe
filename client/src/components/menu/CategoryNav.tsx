import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface CategoryNavProps {
  categories: { id: string; name: string }[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b w-full shadow-sm">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 p-4">
          {categories.map((category) => (
            <div key={category.id} className="relative">
              <Button
                variant="ghost"
                className={cn(
                  'relative rounded-full px-6 font-medium transition-all duration-300 z-10 hover:bg-transparent',
                  activeCategory === category.id
                    ? 'text-primary-foreground hover:text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onSelectCategory(category.id)}
              >
                {category.name}
                {activeCategory === category.id && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/25"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
