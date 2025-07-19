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
}

export function StoreManager({ user, socialLinks, initialProducts }: StoreManagerProps) {
  const [products, setProducts] = useState(initialProducts);

  const handleProductsReorder = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const handleProductDelete = (productId: string) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Products */}
      <div className="lg:col-span-2 space-y-6">
        {products.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
            <ProductList
              products={products}
              onProductsReorder={handleProductsReorder}
              onProductDelete={handleProductDelete}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600">Start by adding your first product to your store.</p>
          </div>
        )}
      </div>

      {/* Right Column - Mobile Preview */}
      <div className="lg:sticky lg:top-6">
        <MobilePreview 
          user={user} 
          socialLinks={socialLinks} 
          products={products}
        />
      </div>
    </div>
  );
}