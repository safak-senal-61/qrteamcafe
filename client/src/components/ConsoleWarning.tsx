'use client';

import { useEffect, useRef } from 'react';

interface ConsoleWarningProps {
  shouldHideLogs: boolean;
}

export default function ConsoleWarning({ shouldHideLogs }: ConsoleWarningProps) {
  // Use a ref to track if we've already set up the override to prevent duplicates
  // and handle StrictMode correctly
  const isOverriddenRef = useRef(false);
  
  // Store original functions in a ref so they persist across renders
  const originalConsoleRef = useRef({
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
    clear: console.clear
  });

  useEffect(() => {
    // If logging should NOT be hidden, ensure we restore originals if they were overridden
    if (!shouldHideLogs) {
      if (isOverriddenRef.current) {
        console.log = originalConsoleRef.current.log;
        console.warn = originalConsoleRef.current.warn;
        console.error = originalConsoleRef.current.error;
        console.info = originalConsoleRef.current.info;
        console.debug = originalConsoleRef.current.debug;
        // console.clear usually doesn't need restoration but for completeness
        console.clear = originalConsoleRef.current.clear;
        isOverriddenRef.current = false;
      }
      return;
    }

    // If already overridden, do nothing (or re-apply if needed, but refs handle persistence)
    // However, if we want to ensure "clear" runs again on mount, we can do it.
    
    const printWarning = () => {
      // Use the ORIGINAL clear to ensure it works
      originalConsoleRef.current.clear.call(console);

      const titleStyle = [
        'color: red',
        'font-size: 60px',
        'font-weight: bold',
        'text-shadow: 2px 2px 0px black',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      ].join(';');

      const bodyStyle = [
        'font-size: 18px',
        'color: #333',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        'line-height: 1.5'
      ].join(';');

      const linkStyle = [
        'font-size: 16px',
        'color: #0095f6',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        'text-decoration: underline',
        'cursor: pointer'
      ].join(';');

      // Use ORIGINAL log to print warning
      originalConsoleRef.current.log.call(console, '%cDUR!', titleStyle);
      
      originalConsoleRef.current.log.call(
        console,
        '%cBu, geliştiriciler için tasarlanmış bir tarayıcı özelliğidir. Biri sana bir qrders özelliğini etkinleştirmek veya birinin hesabını ele geçirmek için bir şeyi kopyalayıp buraya yapıştırmanı söylediyse bu bir dolandırıcılık girişimidir ve bunu yapmanı söyleyen kişi sen bunu yaptığında senin qrders hesabına erişebilecektir.',
        bodyStyle
      );

      originalConsoleRef.current.log.call(
        console,
        '%cDaha fazla bilgi için https://qrders.com.tr/guvenlik adresine göz at.',
        linkStyle
      );
    };

    // Print warning immediately
    printWarning();

    // Define no-op function
    const noop = () => {};

    // Override logic
    const overriddenLog = function(...args: unknown[]) {
      // Allow specific messages to pass through (like our warning)
      // We check if args[0] is a string to avoid errors
      if (args.length > 0 && typeof args[0] === 'string') {
        if (args[0].includes('%cDUR!') || 
            args[0].includes('geliştiriciler için tasarlanmış') || 
            args[0].includes('qrders.com.tr/guvenlik')) {
          originalConsoleRef.current.log.apply(console, args);
          return;
        }
      }
      // Suppress everything else
    };

    // Apply overrides
    console.log = overriddenLog;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
    // We can also override clear to prevent others from clearing our warning
    // console.clear = noop; 
    
    isOverriddenRef.current = true;

    // Cleanup function: Restore originals when component unmounts or shouldHideLogs becomes false
    const originals = originalConsoleRef.current;
    return () => {
      console.log = originals.log;
      console.warn = originals.warn;
      console.error = originals.error;
      console.info = originals.info;
      console.debug = originals.debug;
      console.clear = originals.clear;
      isOverriddenRef.current = false;
    };
    
  }, [shouldHideLogs]);

  return null;
}
