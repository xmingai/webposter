import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rive Demo — 小太阳鹦鹉",
  description: "Interactive Sun Conure parrot animated with SVG + Rive runtime",
};

export default function RiveDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
