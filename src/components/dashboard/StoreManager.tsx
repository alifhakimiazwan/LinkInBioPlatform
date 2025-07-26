"use client";

import { useState } from "react";
import { ProductList } from "./ProductList";

interface Product {
  id: string;
  title: string;
  price: string;
  type: string;
  imageUrl: string | null;
  isDraft?: boolean;
  isActive: boolean;
  subtitle?: string | null;
  buttonText?: string | null;
  formFields?: unknown;
}

interface User {
  dbUser: {
    fullName?: string | null;
    username: string;
    bio?: string | null;
    avatar?: string | null;
  } | null;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface StoreManagerProps {
  user: User;
  socialLinks: SocialLink[];
  initialProducts: Product[];
  onProductsChange?: (products: Product[]) => void;
}

export function StoreManager({
  user,
  socialLinks,
  initialProducts,
  onProductsChange,
}: StoreManagerProps) {
  const [products, setProducts] = useState(initialProducts);

  const handleProductsReorder = (newProducts: Product[]) => {
    setProducts(newProducts);
    onProductsChange?.(newProducts);
  };

  const handleProductDelete = (productId: string) => {
    const updatedProducts = products.filter(
      (product) => product.id !== productId
    );
    setProducts(updatedProducts);
    onProductsChange?.(updatedProducts);
  };

  return (
    <>
      {products.length > 0 && (
        <ProductList
          products={products}
          onProductsReorder={handleProductsReorder}
          onProductDelete={handleProductDelete}
        />
      )}
    </>
  );
}
