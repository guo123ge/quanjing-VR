import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 装修互动全景生成系统",
  description: "上传户型图、选择装修风格并生成互动效果展示。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
