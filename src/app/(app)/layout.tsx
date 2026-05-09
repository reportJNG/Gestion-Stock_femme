'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { OfflineBanner } from '@/components/layout/OfflineBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-blush">
          <OfflineBanner />
          <Sidebar />
          <MobileNav />

          <div className="lg:ml-64">
            <Header className="sticky top-0 z-30 backdrop-blur-sm bg-white/60 border-b border-rose-soft/20 shadow-sm" />
            <main className="mx-auto max-w-7xl p-4 pb-24 lg:p-6 lg:pb-8">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" richColors />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}