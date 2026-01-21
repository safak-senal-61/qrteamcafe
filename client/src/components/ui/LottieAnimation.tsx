'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LottieAnimationProps {
  url?: string;
  animationData?: Record<string, unknown>;
  width?: string | number;
  height?: string | number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export default function LottieAnimation({
  url,
  animationData,
  width = '100%',
  height = '100%',
  className = '',
  loop = true,
  autoplay = true,
}: LottieAnimationProps) {
  const [fetchedData, setFetchedData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    if (url && !animationData) {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
             console.warn(`LottieAnimation: Expected JSON but got ${contentType} for ${url}`);
          }
          return response.text();
        })
        .then((text) => {
          try {
            const jsonData = JSON.parse(text);
            if (isMounted) {
              setFetchedData(jsonData);
              setError(false);
            }
          } catch (e) {
            console.error(`Error parsing Lottie JSON from ${url}:`, e);
            if (isMounted) setError(true);
          }
        })
        .catch((error) => {
          console.error('Error loading Lottie animation:', error);
          if (isMounted) setError(true);
        });
    }
    
    return () => {
      isMounted = false;
      // Reset state on unmount or before next effect (url change)
      setFetchedData(null);
      setError(false);
    };
  }, [url, animationData]);

  const finalData = animationData || fetchedData;
  const isLoading = url && !animationData && !fetchedData && !error;

  if (isLoading) {
    return <div className={`flex items-center justify-center bg-transparent ${className}`} style={{ width, height }} />;
  }

  if (error || !finalData) return null;

  return (
    <div className={className} style={{ width, height }}>
      <Lottie
        animationData={finalData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
