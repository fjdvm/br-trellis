import { ProductDetailPage } from "@/components/features/products/ProductDetailPage";

interface ProductRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductRouteProps) {
  const { id } = await params;
  return {
    title: `Product Detail | BR Online Shop`,
    description: `View details for product ${id}`,
  };
}

export default async function ProductDetailRoute({ params }: ProductRouteProps) {
  const { id } = await params;
  return <ProductDetailPage id={id} />;
}
