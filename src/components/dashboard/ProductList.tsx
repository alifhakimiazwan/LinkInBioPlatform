"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import toast from 'react-hot-toast';
import { DeleteModal } from "@/components/ui/delete-modal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteProductAction } from "@/app/dashboard/store/product-actions";

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

function SortableProduct({ 
  product, 
  onDelete 
}: { 
  product: Product;
  onDelete: (productId: string) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleDeleteClick = () => {
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const result = await deleteProductAction(product.id);
      if (result.success) {
        // Remove from UI immediately
        onDelete(product.id);
        toast.success('Product deleted successfully');
        setShowDeleteModal(false);
      } else {
        toast.error('Failed to delete product. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    if (!deleting) {
      setShowDeleteModal(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-4 p-3 bg-white border border-gray-200 rounded-lg"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600 touch-none"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
        </svg>
      </div>

      {/* Product Thumbnail */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-12 h-12 object-cover rounded-md"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-lg">
            {product.type === "EBOOK"
              ? "📚"
              : product.type === "COURSE"
              ? "🎓"
              : product.type === "TEMPLATE"
              ? "📝"
              : product.type === "CONSULTATION"
              ? "💬"
              : product.type === "WEBINAR"
              ? "🎥"
              : product.type === "SUBSCRIPTION"
              ? "🔄"
              : product.type === "PHYSICAL"
              ? "📦"
              : product.type === "DIGITAL"
              ? "💾"
              : product.type === "COACHING"
              ? "🎯"
              : product.type === "FREE_LEAD"
              ? "🎁"
              : "📄"}
          </span>
        </div>
      )}

      {/* Product Info */}
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900">{product.title}</h4>
          {product.isDraft && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Draft
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {product.type === 'FREE_LEAD' ? 'Free' : `$${product.price}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <a 
          href={product.type === 'FREE_LEAD' 
            ? `/dashboard/store/add-product?type=FREE_LEAD&draftId=${product.id}`
            : '#'
          }
        >
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </a>
        
        {/* Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={deleting}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleModalClose}
        onConfirm={handleDeleteConfirm}
        title={product.title}
        description="This action cannot be undone. The product will be permanently removed from your store."
        isLoading={deleting}
      />
    </div>
  );
}

interface ProductListProps {
  products: Product[];
  onProductsReorder?: (products: Product[]) => void;
  onProductDelete?: (productId: string) => void;
}

export function ProductList({ products, onProductsReorder, onProductDelete }: ProductListProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders drag and drop on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProductDelete = (productId: string) => {
    if (onProductDelete) {
      onProductDelete(productId);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((item) => item.id === active.id);
      const newIndex = products.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(products, oldIndex, newIndex);

      // Update the order and notify parent component
      if (onProductsReorder) {
        onProductsReorder(newItems);
      }

      // Here you would typically call an API to update the order in the database
      console.log(
        "New order:",
        newItems.map((item, index) => ({ id: item.id, position: index }))
      );
    }
  }

  if (products.length === 0) {
    return null;
  }

  // Show simple list during SSR, then hydrate with DnD
  if (!mounted) {
    return (
      <div className="space-y-3 mt-4">
        {products.map((product) => (
          <SortableProduct 
            key={product.id} 
            product={product} 
            onDelete={handleProductDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={products} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 mt-4 cursor-pointer">
          {products.map((product) => (
            <SortableProduct 
              key={product.id} 
              product={product} 
              onDelete={handleProductDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
