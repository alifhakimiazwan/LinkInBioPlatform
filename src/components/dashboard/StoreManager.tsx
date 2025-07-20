"use client";

import { useState } from "react";
import { MobilePreview } from "./MobilePreview";
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
  };
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
      {/* Products Section */}
      {products.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6 my-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
          <ProductList
            products={products}
            onProductsReorder={handleProductsReorder}
            onProductDelete={handleProductDelete}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products yet
          </h3>
          <p className="text-gray-600">
            Start by adding your first product to your store.
          </p>
        </div>
      )}
    </>
  );
}
