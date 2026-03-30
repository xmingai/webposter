import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebPoster - AI 图片编辑器",
  description: "AI-powered poster and image editing canvas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
