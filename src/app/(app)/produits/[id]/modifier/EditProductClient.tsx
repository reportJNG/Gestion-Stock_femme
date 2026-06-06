'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProductDetail, useBrands } from '@/hooks/useProducts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductImageUpload } from '@/components/products/ProductImageUpload';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

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

export function EditProductClient() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const supabase = supabaseClient;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useProductDetail(productId);
  const { data: brands } = useBrands();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('none');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [tvaRate, setTvaRate] = useState('19');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (data?.data?.product) {
      const p = data.data.product;
      setName(p.name);
      setDescription(p.description || '');
      setBrandId(p.brand?.id || 'none');
      setCostPrice(String(p.cost_price));
      setSalePrice(String(p.sale_price));
      setTvaRate(String(p.tva_rate));
      setImageUrl(p.image_url || '');
    }
  }, [data]);

  const updateProduct = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase
        .from('products')
        .update({
          name,
          description: description || null,
          brand_id: brandId === 'none' ? null : brandId,
          cost_price: parseFloat(costPrice) || 0,
          sale_price: parseFloat(salePrice) || 0,
          tva_rate: parseFloat(tvaRate) || 19,
          image_url: imageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit modifié');
      router.push(`/produits/${productId}`);
    },
    onError: (error) => {
      toast.error('Erreur : ' + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="h-10 w-24 rounded-xl bg-rose-light/30 mb-6" />
        <Skeleton className="h-[400px] rounded-2xl bg-rose-light/20" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const product = data?.data?.product;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      <Link href={`/produits/${productId}`}>
        <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
      </Link>

      <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold">Modifier {product?.name}</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du produit</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/90 border-rose-soft/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/90 border-rose-soft/20 rounded-xl min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Marque</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger className="bg-white/90 border-rose-soft/20 rounded-xl">
                <SelectValue placeholder="Choisir une marque" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-rose-soft/20 bg-white/90 backdrop-blur-md">
                <SelectItem value="none">Sans marque</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prix achat HT</Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="bg-white/90 border-rose-soft/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Prix vente HT</Label>
              <Input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="bg-white/90 border-rose-soft/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>TVA (%)</Label>
              <Input
                type="number"
                value={tvaRate}
                onChange={(e) => setTvaRate(e.target.value)}
                className="bg-white/90 border-rose-soft/20 rounded-xl"
              />
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-rose-light/20 text-sm text-muted-foreground">
            <span className="font-medium">Catégorie :</span> {product?.category?.name_fr}{' '}
            <span className="text-xs">(verrouillée – les codes‑barres en dépendent)</span>
          </div>

          <div className="space-y-2">
            <Label>Photo du produit</Label>
            <ProductImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href={`/produits/${productId}`}>
              <Button variant="outline" className="rounded-xl border-rose-soft/20 bg-white/60 hover:bg-white/80">
                Annuler
              </Button>
            </Link>
            <Button
              onClick={() => updateProduct.mutate()}
              disabled={updateProduct.isPending}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-6"
            >
              {updateProduct.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
