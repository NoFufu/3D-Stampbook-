'use client';

import dynamic from 'next/dynamic';

// three.js braucht window/WebGL, daher nur im Browser rendern
const Stampbook = dynamic(() => import('@/stampbook/Stampbook'), { ssr: false });

export default function Home() {
  return <Stampbook />;
}
