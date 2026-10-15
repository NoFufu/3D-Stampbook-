import { Caveat, Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Fraunces mit weichen, leicht verspielten Formen (SOFT/WONK) für den Schriftzug
export const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
});
export const body = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
export const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-jb" });
export const pencil = Caveat({ subsets: ["latin"], weight: ["500"], variable: "--font-pencil" });
