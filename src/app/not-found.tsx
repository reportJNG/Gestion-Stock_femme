import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="rose-glow-icon mb-4 h-16 w-16">
        <Package className="h-8 w-8 stroke-[1.8]" />
      </div>
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-6 text-muted-foreground">Page introuvable</p>
      <Link href="/tableau-de-bord">
        <Button>Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
