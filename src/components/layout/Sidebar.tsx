'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ClipboardList, ScanLine,
  Receipt, BarChart3, Archive, Settings, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/produits',        label: 'Produits',         icon: Package,          roles: ['admin'] },
  { href: '/stock',           label: 'Stock',             icon: ClipboardList,    roles: ['admin', 'worker'] },
  { href: '/scanner',         label: 'Scanner',           icon: ScanLine,         roles: ['admin', 'worker'] },
  { href: '/ventes',          label: 'Ventes',            icon: Receipt,          roles: ['admin', 'worker'] },
  { href: '/rapports',        label: 'Rapports',          icon: BarChart3,        roles: ['admin'] },
  { href: '/archives',        label: 'Archives',          icon: Archive,          roles: ['admin'] },
  { href: '/parametres',      label: 'Paramètres',        icon: Settings,         roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, role, isLoading } = useAuth();
  const filtered = role ? navItems.filter((item) => item.roles.includes(role)) : [];

  const handleLogout = async () => {
    await logout();
    // ✅ Hard navigation — clears all React state, ensures clean session teardown
    window.location.href = '/connexion';
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-rose-soft/20 bg-white/80 backdrop-blur-md lg:flex shadow-sm">
      <div className="border-b border-rose-soft/20 p-4">
        <Link href={role === 'worker' ? '/scanner' : '/tableau-de-bord'} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-light/40 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Gestion Stock</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 w-full rounded-xl bg-rose-light/20 animate-pulse" />
          ))
        ) : (
          filtered.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-rose-light/40 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-rose-light/30 hover:text-primary'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'stroke-[1.5]' : 'stroke-[1.2]')} />
                {item.label}
              </Link>
            );
          })
        )}
      </nav>

      <div className="border-t border-rose-soft/20 p-4">
        <button
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-rose-light/30 hover:text-primary"
        >
          <LogOut className="h-4 w-4 stroke-[1.2]" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}