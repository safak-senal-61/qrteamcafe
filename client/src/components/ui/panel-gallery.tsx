'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const images = [
  '/panel/Ekran görüntüsü 2026-01-21 024141.png',
  '/panel/Ekran görüntüsü 2026-01-21 024200.png',
  '/panel/Ekran görüntüsü 2026-01-21 024220.png',
  '/panel/Ekran görüntüsü 2026-01-21 024419.png',
  '/panel/Ekran görüntüsü 2026-01-21 024438.png',
  '/panel/Ekran görüntüsü 2026-01-21 024453.png',
  '/panel/Ekran görüntüsü 2026-01-21 024517.png',
  '/panel/Ekran görüntüsü 2026-01-21 024531.png',
  '/panel/Ekran görüntüsü 2026-01-21 024548.png',
  '/panel/Ekran görüntüsü 2026-01-21 024607.png',
  '/panel/Ekran görüntüsü 2026-01-21 024620.png',
  '/panel/Ekran görüntüsü 2026-01-21 024633.png',
  '/panel/Ekran görüntüsü 2026-01-21 024650.png',
  '/panel/Ekran görüntüsü 2026-01-21 024710.png',
];

interface PanelGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PanelGallery({ isOpen, onClose }: PanelGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, []);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors hidden md:block"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors hidden md:block"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Main Image Container */}
          <div 
            className="relative w-full h-full max-w-7xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 }
                }}
                className="absolute w-full h-full flex items-center justify-center"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={images[currentIndex]}
                    alt={`Yönetim Paneli Görseli ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    quality={100}
                    priority
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm font-medium backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail Strip (Optional, for larger screens) */}
          <div 
            className="absolute bottom-4 left-0 right-0 h-20 justify-center gap-2 overflow-x-auto hidden lg:flex px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === currentIndex ? 'border-primary scale-110 z-10' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
