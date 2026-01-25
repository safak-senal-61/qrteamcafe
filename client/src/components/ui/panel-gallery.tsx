'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
  '/panel/dashboard-01.png',
  '/panel/dashboard-02.png',
  '/panel/dashboard-03.png',
  '/panel/dashboard-04.png',
  '/panel/dashboard-05.png',
  '/panel/dashboard-06.png',
  '/panel/dashboard-07.png',
  '/panel/dashboard-08.png',
  '/panel/dashboard-09.png',
  '/panel/dashboard-10.png',
  '/panel/dashboard-11.png',
  '/panel/dashboard-12.png',
  '/panel/dashboard-13.png',
  '/panel/dashboard-14.png',
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

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px) 
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

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
            className="absolute left-2 md:left-4 z-50 p-2 md:p-3 rounded-full bg-black/20 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 md:right-4 z-50 p-2 md:p-3 rounded-full bg-black/20 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Main Image Container */}
          <div 
            className="relative w-full h-full max-w-7xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[currentIndex]}
                    alt={`Yönetim Paneli Görseli ${currentIndex + 1}`}
                    className="w-full h-full object-contain select-none"
                    draggable={false}
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
