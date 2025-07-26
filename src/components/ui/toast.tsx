"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-out transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-orange-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px]">
        <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-orange-600" />
        </div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState({
    message: "",
    isVisible: false,
  });

  const showToast = (message: string) => {
    setToast({
      message,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}
