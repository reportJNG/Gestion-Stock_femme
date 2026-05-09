'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-blush p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}