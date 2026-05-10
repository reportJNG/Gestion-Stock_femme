'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ─── Sub-components ────────────────────────────────────────────────────────────

function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {visible
        ? <EyeOff className="h-4 w-4 stroke-[1.8]" />
        : <Eye    className="h-4 w-4 stroke-[1.8]" />
      }
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Connexion réussie');
      router.push('/tableau-de-bord');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-8 pt-8 pb-6 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Package className="h-7 w-7 text-primary stroke-[1.8]" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Gestion Stock</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connectez-vous à votre compte admin</p>
      </div>

      {/* Form */}
      <div className="px-8 pb-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@boutique.dz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl bg-muted/40 border-border/40 text-sm"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-muted-foreground">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-xl bg-muted/40 border-border/40 text-sm pr-10"
                required
                minLength={8}
                autoComplete="current-password"
              />
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-10 rounded-xl text-sm font-medium" disabled={isLoading}>
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}