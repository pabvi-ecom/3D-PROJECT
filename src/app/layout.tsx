import type { Metadata } from "next";
import { Fraunces, Nunito_Sans, Bricolage_Grotesque, Instrument_Sans, Caveat, Chewy, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Tipografía "bubble" hinchada tipo logo (referencia del usuario: Cutpile
// Studio) — Chewy es la más parecida disponible en Google Fonts.
const chewy = Chewy({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400"],
});

// Rotulador/brush handwritten (referencia del usuario: Art Studio) — para
// los títulos de cada paso del configurador /create.
const marker = Permanent_Marker({
  variable: "--font-marker",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — Custom 3D figures of the ones you love`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Upload a photo and we sculpt a full-color 3D figure of your pet. Printed and shipped to your door.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable} ${bricolage.variable} ${instrument.variable} ${caveat.variable} ${chewy.variable} ${marker.variable}`}>
      <body>{children}</body>
    </html>
  );
}
