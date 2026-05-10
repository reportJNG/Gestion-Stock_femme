'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ScanLine, Receipt, MoreHorizontal,
  ClipboardList, BarChart3, Archive, Settings, LogOut,Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

const mainNav = [
  { href: '/tableau-de-bord', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/produits',        label: 'Produits',   icon: Package,          roles: ['admin'] },
  { href: '/stock',           label: 'Stock',       icon: ClipboardList,    roles: ['admin', 'worker'] },
  { href: '/scanner',         label: 'Scan',        icon: ScanLine,         roles: ['admin', 'worker'] },
  { href: '/ventes',          label: 'Ventes',      icon: Receipt,          roles: ['admin', 'worker'] },
];


const moreNav = [
  { href: '/rapports',   label: 'Rapports',   icon: BarChart3, roles: ['admin'] },
  { href: '/archives',   label: 'Archives',   icon: Archive,   roles: ['admin'] },
  { href: '/travailleurs', label: 'Travailleurs', icon: Users, roles: ['admin'] },
  { href: '/parametres', label: 'Paramètres', icon: Settings,  roles: ['admin'] },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, role, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  const filteredMain = role ? mainNav.filter((item) => item.roles.includes(role)) : [];
  const filteredMore = role ? moreNav.filter((item) => item.roles.includes(role)) : [];

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.replace('/connexion');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[4.5rem] border-t border-rose-soft/20 bg-white/70 backdrop-blur-md shadow-sm lg:hidden">
      <div className="flex items-center justify-around h-full px-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-14 rounded-xl bg-rose-light/20 animate-pulse" />
          ))
        ) : (
          <>
            {filteredMain.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all',
                    isActive
                      ? 'bg-rose-light/40 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-rose-light/30 hover:text-primary'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'stroke-[1.5]' : 'stroke-[1.2]')} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}

            {filteredMore.length > 0 ? (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button className="flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-muted-foreground transition-all hover:bg-rose-light/30 hover:text-primary">
                    <MoreHorizontal className="h-5 w-5 stroke-[1.2]" />
                    <span className="text-[10px] font-medium">Plus</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl bg-white/90 backdrop-blur-md border-rose-soft/20 p-6">
                  <SheetHeader>
                    <SheetTitle className="text-left text-lg font-semibold text-foreground">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {filteredMore.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground transition-all hover:bg-rose-light/30 hover:text-primary"
                        >
                          <Icon className="h-5 w-5 stroke-[1.2]" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <button
                      onClick={handleLogout}
                      className="col-span-2 flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground transition-all hover:bg-rose-light/30 hover:text-primary"
                    >
                      <LogOut className="h-5 w-5 stroke-[1.2]" />
                      Déconnexion
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <button
                onClick={handleLogout}
                className="flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-muted-foreground transition-all hover:bg-rose-light/30 hover:text-primary"
              >
                <LogOut className="h-5 w-5 stroke-[1.2]" />
                <span className="text-[10px] font-medium">Quitter</span>
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
