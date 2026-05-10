'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Store,
  AlertTriangle,
  Percent,
  LogOut,
  Moon,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useTheme } from 'next-themes';

// ─── Sub-components ────────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </span>
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-card p-12 text-center shadow-sm">
      <WifiOff className="h-7 w-7 text-muted-foreground" />
      <div>
        <p className="font-semibold text-foreground">Connexion interrompue</p>
        <p className="mt-1 text-sm text-muted-foreground">Réessayez.</p>
      </div>
      <Button onClick={onRetry} variant="outline" className="rounded-xl">
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { logout } = useAuth();
  const { settings, isLoading, isError, refetch, updateSetting } = useSettings();
  const { theme, setTheme } = useTheme();
  const [shopName, setShopName] = useState('');
  const [threshold, setThreshold] = useState('5');
  const [tva, setTva] = useState('19');

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name ?? '');
      setThreshold(String(settings.low_stock_threshold ?? 5));
      setTva(String(settings.tva_rate ?? 19));
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSetting.mutate({ key: 'shop_name', value: shopName });
    updateSetting.mutate({ key: 'low_stock_threshold', value: parseInt(threshold) || 5 });
    updateSetting.mutate({ key: 'tva_rate', value: parseInt(tva) || 19 });
    toast.success('Paramètres sauvegardés');
  };

  if (isLoading) return <SettingsSkeleton />;

  if (isError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-3">

      {/* Shop name */}
      <Section icon={<Store className="h-4 w-4" />} title="Informations boutique">
        <div className="space-y-1.5">
          <Label htmlFor="shopName" className="text-xs text-muted-foreground">
            Nom de la boutique
          </Label>
          <Input
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="h-9 bg-muted/40 border-border/40 rounded-lg text-sm"
            placeholder="Ma boutique…"
          />
        </div>
      </Section>

      {/* Low stock threshold */}
      <Section icon={<AlertTriangle className="h-4 w-4" />} title="Stock">
        <div className="space-y-1.5">
          <Label htmlFor="threshold" className="text-xs text-muted-foreground">
            Seuil de stock faible
          </Label>
          <Input
            id="threshold"
            type="number"
            min="1"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="h-9 bg-muted/40 border-border/40 rounded-lg text-sm"
          />
          <p className="text-xs text-muted-foreground/70 pt-0.5">
            Alerte quand le stock est inférieur ou égal à cette valeur
          </p>
        </div>
      </Section>

      {/* TVA */}
      <Section icon={<Percent className="h-4 w-4" />} title="TVA">
        <div className="space-y-1.5">
          <Label htmlFor="tva" className="text-xs text-muted-foreground">
            Taux TVA par défaut (%)
          </Label>
          <Input
            id="tva"
            type="number"
            min="0"
            max="100"
            value={tva}
            onChange={(e) => setTva(e.target.value)}
            className="h-9 bg-muted/40 border-border/40 rounded-lg text-sm"
          />
        </div>
      </Section>

      {/* Theme */}
      <Section icon={<Moon className="h-4 w-4" />} title="Thème">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Mode sombre</span>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            aria-label="Basculer le mode sombre"
          />
        </div>
      </Section>

      {/* Save */}
      <Button
        onClick={handleSaveSettings}
        className="w-full h-10 rounded-xl text-sm font-medium"
      >
        Sauvegarder les paramètres
      </Button>

      <Separator className="opacity-40" />

      {/* Logout */}
      <Button
        variant="ghost"
        className="w-full h-10 rounded-xl text-sm text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
        onClick={() => logout()}
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </Button>
    </div>
  );
}