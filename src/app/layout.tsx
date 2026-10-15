import type { Metadata } from 'next';
import './globals.css';
// Styles der Heft-Komponenten hier global laden: CSS aus per next/dynamic (ssr: false)
// nachgeladenen Modulen wird im Production-Build sonst nicht ausgeliefert.
import '@/stampbook/Stampbook.css';
import '@/stampbook/reactbits/Aurora.css';
import '@/stampbook/reactbits/Dock.css';
import '@/stampbook/reactbits/StarBorder.css';

export const metadata: Metadata = {
  title: 'Mein 3D-Stempelheft',
  description: 'Digitales Stempelheft in 3D zum Blättern und Seiten einkleben'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
