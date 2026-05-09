import { ProductDetailClient } from './ProductDetailClient';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function ProductDetailPage() {
  return (
    <div className="min-h-screen">
      <ProductDetailClient />
    </div>
  );
}