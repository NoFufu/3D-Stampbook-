import { Bricolage_Grotesque, Caveat, Instrument_Sans, JetBrains_Mono } from "next/font/google";

export const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "800"], variable: "--font-bricolage" });
export const body = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
export const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-jb" });
export const pencil = Caveat({ subsets: ["latin"], weight: ["500"], variable: "--font-pencil" });
