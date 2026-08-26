"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crmClient } from "@/lib/api/crm-client";
import type { ProductListItem } from "@/types/ecommerce";

export function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const result = await crmClient.ecommerceProducts.list();
      setProducts(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Products
        </h1>
        <p className="text-body-md text-muted-foreground">
          View and manage your product catalog.
        </p>
      </div>

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">All Products</CardTitle>
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : products.length === 0 ? (
            <div className="p-xl text-muted-foreground">No products found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.platformProductId}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.inStock ? "default" : "destructive"}
                      >
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
