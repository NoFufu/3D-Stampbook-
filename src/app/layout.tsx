import type { Metadata } from "next";
import { body, display, mono, pencil } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stanzheft",
  description: "Mein Ausstanz-Heft in 3D: durchblättern, Marken ansehen, neue Seiten einkleben.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`dark ${display.variable} ${body.variable} ${mono.variable} ${pencil.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
