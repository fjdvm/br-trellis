"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/DataTable";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { crmClient } from "@/lib/api/crm-client";
import { useEcommerceSyncStatus } from "@/hooks/useEcommerceSyncStatus";
import { EcommerceConnectPrompt } from "./EcommerceConnectPrompt";
import type { ProductListItem } from "@/types/ecommerce";

const columns: Column<ProductListItem>[] = [
  {
    header: "Product ID",
    className: "min-w-[130px]",
    cell: (row) => <span className="font-medium">{row.platformProductId}</span>,
  },
  {
    header: "Name",
    className: "min-w-[160px]",
    cell: (row) => row.name,
  },
  {
    header: "Price",
    className: "min-w-[90px]",
    cell: (row) => `$${row.price.toFixed(2)}`,
  },
  {
    header: "Stock Status",
    className: "min-w-[120px]",
    cell: (row) => (
      <Badge variant={row.inStock ? "default" : "destructive"}>
        {row.inStock ? "In Stock" : "Out of Stock"}
      </Badge>
    ),
  },
  {
    header: "Last Updated",
    className: "min-w-[120px]",
    cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
  },
];

function searchProducts(product: ProductListItem, query: string): boolean {
  return (
    product.platformProductId.toLowerCase().includes(query) ||
    product.name.toLowerCase().includes(query)
  );
}

export function ProductsPage() {
  const { status: syncState, isLoading: syncLoading } = useEcommerceSyncStatus();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const result = await crmClient.ecommerceProducts.list();
      setProducts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  if (!syncLoading && syncState === "never_connected") {
    return <EcommerceConnectPrompt />;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Products
        </h1>
        <p className="text-body-md text-muted-foreground">
          Product catalog synced from the ecommerce platform.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">All Products</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : (
            <DataTable
              data={products}
              columns={columns}
              searchPlaceholder="Search products&#x2026;"
              searchFn={searchProducts}
              emptyMessage="No products found."
              getRowKey={(row) => row.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
