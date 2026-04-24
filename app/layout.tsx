import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: 'SkyReady — Vigilance Training',
    template: '%s | SkyReady',
  },
  description:
    'SkyReady is an invite-only vigilance training platform for aviation professionals. Sharpen your situational awareness with timed detection exercises.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    siteName: 'SkyReady',
    title: 'SkyReady — Vigilance Training',
    description:
      'Invite-only vigilance training for aviation professionals. Timed detection exercises with performance analytics.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary',
    title: 'SkyReady — Vigilance Training',
    description:
      'Invite-only vigilance training for aviation professionals. Timed detection exercises with performance analytics.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
