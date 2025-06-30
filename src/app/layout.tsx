import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL('https://daycompass.vercel.app'),
  title: 'Day Compass',
  description: 'An intelligent daily planner to help you chart the perfect day.',
  openGraph: {
    title: 'Day Compass',
    description: 'An intelligent daily planner to help you chart the perfect day.',
    url: 'https://daycompass.vercel.app/',
    siteName: 'Day Compass',
    images: [
      {
        url: '/og-image.png', // The path to your image in the `public` folder
        width: 1200,
        height: 630,
        alt: 'Day Compass Application Interface',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Day Compass',
    description: 'An intelligent daily planner to help you chart the perfect day.',
    images: ['/og-image.png'], // The path to your image in the `public` folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
