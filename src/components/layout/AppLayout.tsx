'use client';

import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext'; // ✅ ADD THIS

const Sidebar = dynamic(
  () => import('@/components/layout/Sidebar').then((mod) => mod.Sidebar),
  { ssr: false }
);

const MobileNav = dynamic(
  () => import('@/components/layout/MobileNav').then((mod) => mod.MobileNav),
  { ssr: false }
);

const Header = dynamic(
  () => import('@/components/layout/Header').then((mod) => mod.Header),
  { ssr: false }
);

const OfflineBanner = dynamic(
  () =>
    import('@/components/layout/OfflineBanner').then(
      (mod) => mod.OfflineBanner
    ),
  { ssr: false }
);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        {/* ✅ WRAP EVERYTHING WITH AUTH PROVIDER */}
        <AuthProvider>
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
        </AuthProvider>

        <Toaster position="top-right" richColors />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}