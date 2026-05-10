import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blush">
      <Sidebar />
      <MobileNav />
      <div className="lg:ml-64">
        <Header className="sticky top-0 z-30 backdrop-blur-sm bg-white/60 border-b border-rose-soft/20 shadow-sm" />
        <main className="mx-auto max-w-7xl p-4 pb-24 lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}