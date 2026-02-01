'use client';

import { useEffect, useRef } from 'react';

interface IyzipayFormProps {
  content: string;
}

export default function IyzipayForm({ content }: IyzipayFormProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!content || hasRun.current) return;

    // Extract script content
    // Regex to capture content between <script...> and </script>
    // Handles attributes like type="text/javascript"
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/;
    const match = content.match(scriptRegex);

    if (match && match[1]) {
      const scriptContent = match[1];
      
      // Execute script
      // Creating a script element is the safest way to execute it in the global context
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = scriptContent;
      
      // Append to body so it runs
      document.body.appendChild(script);
      
      hasRun.current = true;

      // Cleanup
      return () => {
        if (document.body.contains(script)) {
            document.body.removeChild(script);
        }
      };
    }
  }, [content]);

  return (
    <div className="w-full min-h-[400px] flex justify-center items-start bg-white rounded-lg p-2 sm:p-4">
       {/* Iyzico script looks for this specific ID */}
       <div id="iyzipay-checkout-form" className="responsive w-full"></div>
    </div>
  );
}
