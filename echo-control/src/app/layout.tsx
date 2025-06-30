import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Echo Control',
  description: 'Control plane for Echo applications',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="antialiased bg-background text-foreground min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
