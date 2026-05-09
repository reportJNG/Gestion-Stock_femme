'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from '../notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const routeLabels: Record<string, string> = {
  '/tableau-de-bord': 'Tableau de bord',
  '/produits': 'Produits',
  '/produits/nouveau': 'Nouveau produit',
  '/stock': 'Stock',
  '/scanner': 'Scanner',
  '/ventes': 'Ventes',
  '/rapports': 'Rapports',
  '/archives': 'Archives',
  '/parametres': 'Paramètres',
};

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const { isWorker } = useAuth(); // ✅ reads from shared context, no extra subscription
  const normalizedPath = pathname.replace(/\/$/, '') || '/';

  const getLabel = () => {
    if (normalizedPath.startsWith('/produits/') && normalizedPath.includes('/modifier'))
      return 'Modifier produit';
    if (normalizedPath === '/produits') return 'Produits';
    if (normalizedPath.startsWith('/produits/')) return 'Détail produit';
    if (normalizedPath === '/ventes') return 'Ventes';
    if (normalizedPath.startsWith('/ventes/')) return 'Détail vente';
    return routeLabels[normalizedPath] || '';
  };

  return (
    <header className={cn(
      'flex h-16 items-center justify-between border-b border-rose-soft/20 bg-white/70 backdrop-blur-md px-4 lg:px-6',
      className
    )}>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {getLabel()}
      </h1>
      <div className="flex items-center gap-1.5">
        {!isWorker && <NotificationBell />}
        <ThemeToggle />
      </div>
    </header>
  );
}