export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  unitPrice: number;
  images: string[];
  quantity: number;
  stock: number;
  totalPrice: number;
}

export interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
  subtotal: number;
  totalItems: number;
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
