'use client';

import { useEffect } from 'react';

export default function DebugPage() {
  useEffect(() => {
    console.log('Debug Page Mounted');
  }, []);

  return (
    <div style={{ padding: 50, background: 'red', color: 'white', fontSize: 30 }}>
      DEBUG PAGE IS WORKING
    </div>
  );
}
