"use client";

import { useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { ProfileOverview } from "./ProfileOverview";

interface FormField {
  id: string;
  type: "name" | "email" | "phone" | "text";
  label: string;
  required: boolean;
}

interface DigitalProductData {
  style: 'button' | 'callout';
  description: string;
  ctaButtonText: string;
  collectFields: FormField[];
  checkoutImageUrl?: string;
}

interface Product {
  id: string;
  title: string;
  subtitle?: string | null;
  buttonText?: string | null;
  imageUrl?: string | null;
  type: string;
  price?: string | number;
  formFields?: DigitalProductData | unknown;
}

interface User {
  fullName?: string | null;
  username: string;
  bio?: string | null;
  avatar?: string | null;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface CheckoutPageProps {
  user: User;
  product: Product;
  socialLinks?: SocialLink[];
  onBack: () => void;
}

export function CheckoutPage({ user, product, socialLinks = [], onBack }: CheckoutPageProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const productPrice = product.price ? Number(product.price) : 0;
  const digitalData = product.formFields as DigitalProductData;

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCheckout = async () => {
    // Validate required fields
    if (digitalData?.collectFields) {
      for (const field of digitalData.collectFields) {
        if (field.required && !formData[field.id]) {
          alert(`Please fill in the ${field.label} field`);
          return;
        }
      }
    }

    setIsProcessing(true);

    try {
      // TODO: Implement actual payment processing
      // This would typically create a Stripe checkout session
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      alert("Payment successful! Check your email for the download link.");
      
      // Reset form and go back
      setFormData({});
      onBack();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to render description with basic markdown
  const renderFormattedText = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Handle bullet points
        if (line.trim().startsWith('•')) {
          return (
            <div key={index} className="flex items-start space-x-2 mb-1">
              <span className="text-purple-600 mt-1">•</span>
              <span className="flex-1 text-sm text-gray-700">{line.replace('•', '').trim()}</span>
            </div>
          );
        }
        
        // Handle bold and italic (simple version)
        const formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-purple-600 underline">$1</a>');
        
        return (
          <p key={index} className="text-sm text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      });
  };

  // Get checkout image (prioritize checkout-specific image, fallback to main image)
  const checkoutImageUrl = digitalData?.checkoutImageUrl || product.imageUrl;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Mobile Layout - Matching checkout preview exactly */}
      <div className="lg:hidden max-w-sm mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {/* Back Button */}
            <div className="flex items-center mb-4">
              <button 
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>

            {/* Product Image */}
            <div className="mb-6">
              {checkoutImageUrl ? (
                <img
                  src={checkoutImageUrl}
                  alt="Product"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>

            {/* Price */}
            <div className="text-2xl font-bold text-purple-600 mb-4">
              ${productPrice.toFixed(2)}
            </div>

            {/* Description */}
            <div className="mb-6">
              {digitalData?.description ? (
                <div className="space-y-2">
                  {renderFormattedText(digitalData.description)}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Product description will appear here...
                </p>
              )}
            </div>

            {/* Customer Info Collection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
              <div className="space-y-3">
                {digitalData?.collectFields ? (
                  digitalData.collectFields.map((field) => (
                    <div key={field.id}>
                      {field.type !== "name" && field.type !== "email" && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      <input
                        type={
                          field.type === "email"
                            ? "email"
                            : field.type === "phone"
                            ? "tel"
                            : "text"
                        }
                        placeholder={
                          field.type === "name"
                            ? "Enter your name"
                            : field.type === "email"
                            ? "Enter your email"
                            : field.type === "phone"
                            ? "Enter your phone number"
                            : `Enter your ${field.label.toLowerCase()}`
                        }
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  ))
                ) : (
                  // Default fields if none configured
                  <>
                    <div>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                digitalData?.ctaButtonText || 'Purchase Now'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Profile overview + Product details */}
      <div className="hidden lg:block max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Overview (fixed) */}
          <div className="lg:col-span-1">
            <ProfileOverview user={user} socialLinks={socialLinks} />
          </div>

          {/* Right Column - Product Details and Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-8">
                {/* Back Button - Above product image */}
                <div className="flex items-center mb-6">
                  <button 
                    onClick={onBack}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 mr-3" />
                    <span className="text-base font-medium">Back</span>
                  </button>
                </div>

                {/* Product Image */}
                <div className="mb-8">
                  {checkoutImageUrl ? (
                    <img
                      src={checkoutImageUrl}
                      alt="Product"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {product.title}
                </h1>

                {/* Price */}
                <div className="text-3xl font-bold text-purple-600 mb-6">
                  ${productPrice.toFixed(2)}
                </div>

                {/* Description */}
                <div className="mb-8">
                  {digitalData?.description ? (
                    <div className="space-y-3">
                      {renderFormattedText(digitalData.description)}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-base italic">
                      Product description will appear here...
                    </p>
                  )}
                </div>

                {/* Customer Info Collection - Below description */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Information</h3>
                  <div className="space-y-4">
                    {digitalData?.collectFields ? (
                      digitalData.collectFields.map((field) => (
                        <div key={field.id}>
                          {field.type !== "name" && field.type !== "email" && (
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                          )}
                          <input
                            type={
                              field.type === "email"
                                ? "email"
                                : field.type === "phone"
                                ? "tel"
                                : "text"
                            }
                            placeholder={
                              field.type === "name"
                                ? "Enter your name"
                                : field.type === "email"
                                ? "Enter your email"
                                : field.type === "phone"
                                ? "Enter your phone number"
                                : `Enter your ${field.label.toLowerCase()}`
                            }
                            value={formData[field.id] || ""}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      ))
                    ) : (
                      // Default fields if none configured
                      <>
                        <div>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={formData.name || ""}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email || ""}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg text-base font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    digitalData?.ctaButtonText || 'Purchase Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}