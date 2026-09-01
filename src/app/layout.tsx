import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
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
    <html lang="en" className={`${fraunces.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
