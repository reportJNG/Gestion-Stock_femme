'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories, useColors, useBrands } from '@/hooks/useProducts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { StepIndicator } from '@/components/products/StepIndicator';
import { ColorPicker } from '@/components/products/ColorPicker';
import { SizeSelector } from '@/components/products/SizeSelector';
import { ProductImageUpload } from '@/components/products/ProductImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const STEPS = ['Informations', 'Couleurs & Tailles', 'Récapitulatif'];

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('none');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [tvaRate, setTvaRate] = useState('19');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const { data: categories } = useCategories();
  const { data: colors } = useColors();
  const { data: brands } = useBrands();

  const selectedCategory = categories?.find((c) => c.id === categoryId);

  const createProduct = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_product_with_all_variants', {
        p_name: name,
        p_description: description || null,
        p_category_id: categoryId,
        p_brand_id: brandId === 'none' ? null : brandId,
        p_cost_price: parseFloat(costPrice) || 0,
        p_sale_price: parseFloat(salePrice) || 0,
        p_tva_rate: parseFloat(tvaRate) || 19,
        p_image_url: imageUrl || null,
        p_color_ids: selectedColors,
        p_sizes: selectedSizes,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string; message?: string } | null;
      if (result?.success === false) {
        throw new Error(result.message || result.error || 'Erreur lors de la création du produit');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Produit créé avec ${(data as { variants_count?: number })?.variants_count || 0} variants`);
      router.push('/produits');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const canNextStep0 = name && categoryId && costPrice && salePrice;
  const canNextStep1 = selectedColors.length > 0 && selectedSizes.length > 0;

  const priceTtc = parseFloat(salePrice) * (1 + parseFloat(tvaRate || '19') / 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* Step 0: Product info */}
      {step === 0 && (
        <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: T-shirt Nike"
              className="bg-white/90 border-rose-soft/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du produit..."
              className="bg-white/90 border-rose-soft/20 rounded-xl min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-white/90 border-rose-soft/20 rounded-xl">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-rose-soft/20 bg-white/90 backdrop-blur-md">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name_fr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cost">Prix achat HT *</Label>
              <Input
                id="cost"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="bg-white/90 border-rose-soft/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale">Prix vente HT *</Label>
              <Input
                id="sale"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
                className="bg-white/90 border-rose-soft/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tva">TVA (%)</Label>
              <Input
                id="tva"
                type="number"
                value={tvaRate}
                onChange={(e) => setTvaRate(e.target.value)}
                className="bg-white/90 border-rose-soft/20 rounded-xl"
              />
            </div>
          </div>

          {salePrice && (
            <p className="px-4 py-2 rounded-xl bg-rose-light/40 text-sm text-primary font-medium">
              Prix TTC : <span className="font-semibold">{priceTtc.toFixed(2)} DZD</span>
            </p>
          )}

          <div className="space-y-2">
            <Label>Photo du produit</Label>
            <ProductImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setStep(1)}
              disabled={!canNextStep0}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-6"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Colors & sizes */}
      {step === 1 && (
        <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-6 shadow-sm space-y-6">
          {colors && (
            <div>
              <h3 className="text-sm font-medium mb-3">Couleurs disponibles</h3>
              <ColorPicker
                colors={colors}
                selected={selectedColors}
                onChange={setSelectedColors}
              />
            </div>
          )}

          {selectedCategory && (
            <div>
              <h3 className="text-sm font-medium mb-3">Tailles ({selectedCategory.size_type})</h3>
              <SizeSelector
                sizeType={selectedCategory.size_type as 'clothing' | 'shoes' | 'waist' | 'free'}
                selected={selectedSizes}
                onChange={setSelectedSizes}
              />
            </div>
          )}

          <div className="px-4 py-2 rounded-xl bg-rose-light/20 text-sm text-muted-foreground">
            {selectedColors.length} couleur(s) × {selectedSizes.length} taille(s) ={' '}
            <span className="font-semibold">{selectedColors.length * selectedSizes.length} variants</span>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              className="rounded-xl border-rose-soft/20 bg-white/60 hover:bg-white/80"
            >
              Précédent
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={!canNextStep1}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-6"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Summary */}
      {step === 2 && (
        <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-6 shadow-sm space-y-4">
          <h3 className="font-medium text-lg">Récapitulatif</h3>

          <div className="rounded-xl bg-rose-light/10 border border-rose-soft/20 p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Catégorie</span>
              <span className="font-medium">{selectedCategory?.name_fr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix vente HT</span>
              <span className="font-medium">{salePrice} DZD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA</span>
              <span className="font-medium">{tvaRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix TTC</span>
              <span className="font-semibold text-primary">{priceTtc.toFixed(2)} DZD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Couleurs</span>
              <span className="font-medium">{selectedColors.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tailles</span>
              <span className="font-medium">{selectedSizes.length}</span>
            </div>
            <div className="flex justify-between border-t border-rose-soft/20 pt-1.5 mt-1.5">
              <span className="text-muted-foreground">Total variants</span>
              <span className="font-semibold">{selectedColors.length * selectedSizes.length}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="rounded-xl border-rose-soft/20 bg-white/60 hover:bg-white/80"
            >
              Précédent
            </Button>
            <Button
              onClick={() => createProduct.mutate()}
              disabled={createProduct.isPending}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-8"
            >
              {createProduct.isPending ? 'Création...' : 'Créer le produit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}