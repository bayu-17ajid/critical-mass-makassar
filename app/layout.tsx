import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/supabase/auth-context';
import { AppShell } from '@/components/layout/AppShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Critical Mass Makassar — Cycling Together',
  description:
    'Platform komunitas Critical Mass Makassar untuk melihat event, Tikum, rute, peserta, dan live map saat hari H.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Critical Mass Makassar',
  },
  openGraph: {
    title: 'Critical Mass Makassar — Cycling Together',
    description:
      'Platform komunitas Critical Mass Makassar untuk melihat event, Tikum, rute, peserta, dan live map saat hari H.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Critical Mass Makassar',
  },
};

export const viewport: Viewport = {
  themeColor: '#080d1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#080d1a] text-[#f1f5f9]">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
