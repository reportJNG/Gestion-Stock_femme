import { SaleDetailClient } from './SaleDetailClient';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function SaleDetailPage() {
  return <SaleDetailClient />;
}
