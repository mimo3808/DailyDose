import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DayilyDose · 每日音频简报',
  description: '把你关心的行业新闻转成每日音频简报，AI 总结 + 自然语音朗读',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'DayilyDose · 每日音频简报',
    description: '把你关心的行业新闻转成每日音频简报，AI 总结 + 自然语音朗读',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;600&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  );
}
