import { EditProductClient } from './EditProductClient';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function EditProductPage() {
  return <EditProductClient />;
}