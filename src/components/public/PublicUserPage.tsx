"use client";

import { useState } from "react";
import {
  Instagram,
  Twitter,
  Music,
  Youtube,
  Link,
  Linkedin,
  Github,
  Facebook,
  Twitch,
  Camera,
} from "lucide-react";
import { CheckoutPage } from "./CheckoutPage";
import { ProfileOverview } from "./ProfileOverview";

interface FormField {
  id: string;
  type: "name" | "email" | "phone" | "text";
  label: string;
  required: boolean;
}

interface DigitalProductData {
  style: "button" | "callout";
  description: string;
  ctaButtonText: string;
}

interface WebinarData {
  style: "button" | "callout";
  webinarDate: string;
  webinarTime: string;
  timeZone: string;
  duration: string;
}

interface Product {
  id: string;
  title: string;
  subtitle?: string | null;
  buttonText?: string | null;
  imageUrl?: string | null;
  type: string;
  price?: string | number;
  isActive: boolean;
  isDraft: boolean;
  formFields?: FormField[] | unknown;
  deliveryType?: string | null;
  redirectUrl?: string | null;
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

interface PublicUserPageProps {
  user: User;
  socialLinks: SocialLink[];
  products: Product[];
}

export function PublicUserPage({
  user,
  socialLinks,
  products,
}: PublicUserPageProps) {
  const [formData, setFormData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [currentView, setCurrentView] = useState<"main" | "checkout">("main");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return {
          icon: Instagram,
          bg: "bg-gradient-to-tr from-purple-400 to-pink-400",
        };
      case "twitter":
        return { icon: Twitter, bg: "bg-blue-400" };
      case "tiktok":
        return { icon: Music, bg: "bg-black" };
      case "youtube":
        return { icon: Youtube, bg: "bg-red-500" };
      case "linkedin":
        return { icon: Linkedin, bg: "bg-blue-600" };
      case "github":
        return { icon: Github, bg: "bg-gray-800" };
      case "facebook":
        return { icon: Facebook, bg: "bg-blue-600" };
      case "twitch":
        return { icon: Twitch, bg: "bg-purple-600" };
      default:
        return { icon: Link, bg: "bg-gray-400" };
    }
  };

  const handleInputChange = (
    productId: string,
    fieldId: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [fieldId]: value,
      },
    }));
  };

  const handleSubmit = async (productId: string, product: Product) => {
    const data = formData[productId] || {};

    // Validate required fields
    if (product.formFields) {
      const fields = product.formFields as FormField[];
      for (const field of fields) {
        if (field.required && !data[field.id]) {
          alert(`Please fill in the ${field.label} field`);
          return;
        }
      }
    }

    // Validate email field (required for all lead magnets)
    const emailValue = data.email || data["2"]; // Default email field ID is '2'
    if (!emailValue) {
      alert("Please enter your email address");
      return;
    }

    try {
      // Submit to leads API
      const response = await fetch("/api/leads/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
          formData: data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.redirectUrl) {
          // Redirect delivery
          alert("Thank you! Redirecting you now...");
          window.open(result.redirectUrl, "_blank");
        } else {
          // Email delivery
          alert("Thank you! Check your email for your download link.");
        }

        // Clear form
        setFormData((prev) => ({
          ...prev,
          [productId]: {},
        }));
      } else {
        alert(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleProductPurchase = async (productId: string, product: Product) => {
    setSelectedProduct(product);
    setCurrentView("checkout");
  };

  const handleBackToMain = () => {
    setCurrentView("main");
    setSelectedProduct(null);
  };

  const handleWebinarRegistration = async (
    productId: string,
    product: Product
  ) => {
    // TODO: Implement webinar registration with payment
    // For now, simulate registration process
    const confirmed = confirm(
      `Register for "${product.title}" for $${
        product.price ? Number(product.price).toFixed(2) : "0.00"
      }?`
    );

    if (confirmed) {
      // In a real implementation, this would:
      // 1. Collect registration details
      // 2. Process payment
      // 3. Send confirmation email
      // 4. Add to Google Calendar event
      alert(
        "Redirecting to registration...\n\n(Webinar registration flow not yet implemented)"
      );
      console.log("Webinar registration:", { productId, product });
    }
  };

  // Show checkout page if in checkout view
  if (currentView === "checkout" && selectedProduct) {
    return (
      <CheckoutPage
        user={user}
        product={selectedProduct}
        socialLinks={socialLinks}
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Mobile Layout */}
      <div className="lg:hidden max-w-sm mx-auto px-4">
        <div className="text-center">
          {/* Profile Picture */}
          <div className="mb-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                <span className="text-3xl text-gray-500">
                  {(user.fullName || user.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Display Name */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {user.fullName || user.username}
          </h1>

          {/* Username */}
          <p className="text-gray-600 text-sm mb-4">@{user.username}</p>

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-700 text-sm mb-6 leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="mb-8 flex justify-center space-x-4">
              {socialLinks.map((link) => {
                const { icon: IconComponent, bg } = getSocialIcon(
                  link.platform
                );
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="text-white w-6 h-6" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div className="space-y-3">
              {products.map((product) => {
                // Handle DIGITAL products with different styles
                if (product.type === "DIGITAL") {
                  const digitalData = product.formFields as DigitalProductData;

                  if (digitalData?.style === "button") {
                    // Button Style - Simple row layout (matches MobilePreview exactly)
                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-purple-600 font-semibold text-sm">
                              $
                              {product.price
                                ? Number(product.price).toFixed(2)
                                : "0.00"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Callout Style - Full card layout (matches MobilePreview exactly)
                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {product.subtitle ||
                                "Product subtitle description"}
                            </div>
                            <div className="text-purple-600 font-semibold text-sm">
                              $
                              {product.price
                                ? Number(product.price).toFixed(2)
                                : "0.00"}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleProductPurchase(product.id, product)
                          }
                          className="w-full bg-purple-600 text-white text-xs py-2 rounded"
                        >
                          {digitalData?.ctaButtonText ||
                            product.buttonText ||
                            "Buy Now"}
                        </button>
                      </div>
                    );
                  }
                }

                // Handle WEBINAR products with different styles
                if (product.type === "WEBINAR") {
                  const webinarData = product.formFields as WebinarData;

                  if (webinarData?.style === "button") {
                    // Button Style - Simple row layout (matches MobilePreview exactly)
                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              {webinarData?.webinarDate &&
                              webinarData?.webinarTime
                                ? `${webinarData.webinarDate} at ${webinarData.webinarTime}`
                                : "Webinar date TBD"}
                            </div>
                            <div className="text-purple-600 font-semibold text-sm">
                              $
                              {product.price
                                ? Number(product.price).toFixed(2)
                                : "0.00"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Callout Style - Full card layout (matches MobilePreview exactly)
                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-gray-600 text-xs mb-1">
                              {product.subtitle ||
                                "Join this exclusive webinar"}
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              📅{" "}
                              {webinarData?.webinarDate &&
                              webinarData?.webinarTime
                                ? `${webinarData.webinarDate} at ${webinarData.webinarTime}`
                                : "Date TBD"}
                            </div>
                            <div className="text-purple-600 font-semibold text-sm">
                              $
                              {product.price
                                ? Number(product.price).toFixed(2)
                                : "0.00"}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleWebinarRegistration(product.id, product)
                          }
                          className="w-full bg-purple-600 text-white text-xs py-2 rounded"
                        >
                          {product.buttonText || "Register Now"}
                        </button>
                      </div>
                    );
                  }
                }

                // Handle FREE_LEAD products (original implementation)
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
                  >
                    <div className="flex space-x-4 mb-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {product.subtitle ||
                            "Describe the value of your free resource here"}
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      {product.type === "FREE_LEAD" && product.formFields ? (
                        (product.formFields as FormField[]).map((field) => (
                          <div key={field.id}>
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
                              value={formData[product.id]?.[field.id] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  product.id,
                                  field.id,
                                  e.target.value
                                )
                              }
                              required={field.required}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        ))
                      ) : (
                        // Default fields for non-lead magnets or products without form fields
                        <>
                          <div>
                            <input
                              type="text"
                              placeholder="Enter your name"
                              value={formData[product.id]?.["name"] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  product.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              required
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <input
                              type="email"
                              placeholder="Enter your email"
                              value={formData[product.id]?.["email"] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  product.id,
                                  "email",
                                  e.target.value
                                )
                              }
                              required
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => handleSubmit(product.id, product)}
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        {product.buttonText || "Get Free Download"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">Powered by LinkBio Platform</p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-15">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <ProfileOverview user={user} socialLinks={socialLinks} />
          </div>

          {/* Right Column - Products */}
          <div className="lg:col-span-2">
            {products.length > 0 ? (
              <div className="space-y-4">
                {products.map((product) => {
                  // Handle DIGITAL products with different styles
                  if (product.type === "DIGITAL") {
                    const digitalData =
                      product.formFields as DigitalProductData;

                    if (digitalData?.style === "button") {
                      // Button Style - Simple row layout (desktop optimized)
                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-base text-gray-900">
                                {product.title}
                              </div>
                              <div className="text-purple-600 font-semibold text-base">
                                $
                                {product.price
                                  ? Number(product.price).toFixed(2)
                                  : "0.00"}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleProductPurchase(product.id, product)
                              }
                              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      // Callout Style - Full card layout (desktop optimized)
                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
                        >
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-lg text-gray-900">
                                {product.title}
                              </div>
                              <div className="text-gray-600 text-sm">
                                {product.subtitle ||
                                  "Product subtitle description"}
                              </div>
                              <div className="text-purple-600 font-semibold text-base">
                                $
                                {product.price
                                  ? Number(product.price).toFixed(2)
                                  : "0.00"}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleProductPurchase(product.id, product)
                            }
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                          >
                            {digitalData?.ctaButtonText ||
                              product.buttonText ||
                              "Buy Now"}
                          </button>
                        </div>
                      );
                    }
                  }

                  // Handle WEBINAR products with different styles
                  if (product.type === "WEBINAR") {
                    const webinarData = product.formFields as WebinarData;

                    if (webinarData?.style === "button") {
                      // Button Style - Simple row layout (desktop optimized)
                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-base text-gray-900">
                                {product.title}
                              </div>
                              <div className="text-sm text-gray-500 mb-1">
                                {webinarData?.webinarDate &&
                                webinarData?.webinarTime
                                  ? `${webinarData.webinarDate} at ${webinarData.webinarTime}`
                                  : "Webinar date TBD"}
                              </div>
                              <div className="text-purple-600 font-semibold text-base">
                                $
                                {product.price
                                  ? Number(product.price).toFixed(2)
                                  : "0.00"}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleWebinarRegistration(product.id, product)
                              }
                              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                            >
                              Register
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      // Callout Style - Full card layout (desktop optimized)
                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
                        >
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-lg text-gray-900">
                                {product.title}
                              </div>
                              <div className="text-gray-600 text-sm mb-1">
                                {product.subtitle ||
                                  "Join this exclusive webinar"}
                              </div>
                              <div className="text-sm text-gray-500 mb-1">
                                📅{" "}
                                {webinarData?.webinarDate &&
                                webinarData?.webinarTime
                                  ? `${webinarData.webinarDate} at ${webinarData.webinarTime}`
                                  : "Date TBD"}
                              </div>
                              <div className="text-purple-600 font-semibold text-base">
                                $
                                {product.price
                                  ? Number(product.price).toFixed(2)
                                  : "0.00"}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleWebinarRegistration(product.id, product)
                            }
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                          >
                            {product.buttonText || "Register Now"}
                          </button>
                        </div>
                      );
                    }
                  }

                  // Handle FREE_LEAD products (desktop optimized)
                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
                    >
                      <div className="flex space-x-4 mb-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Camera className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div className="flex-1 min-w-0 text-left">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {product.title}
                          </h3>
                          <p className="text-base text-gray-600 leading-relaxed">
                            {product.subtitle ||
                              "Describe the value of your free resource here"}
                          </p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4">
                        {product.type === "FREE_LEAD" && product.formFields ? (
                          (product.formFields as FormField[]).map((field) => (
                            <div key={field.id}>
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
                                value={formData[product.id]?.[field.id] || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    product.id,
                                    field.id,
                                    e.target.value
                                  )
                                }
                                required={field.required}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          ))
                        ) : (
                          // Default fields for non-lead magnets or products without form fields
                          <>
                            <div>
                              <input
                                type="text"
                                placeholder="Enter your name"
                                value={formData[product.id]?.["name"] || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    product.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                required
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <input
                                type="email"
                                placeholder="Enter your email"
                                value={formData[product.id]?.["email"] || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    product.id,
                                    "email",
                                    e.target.value
                                  )
                                }
                                required
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </>
                        )}

                        <button
                          onClick={() => handleSubmit(product.id, product)}
                          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg text-base font-medium hover:bg-purple-700 transition-colors"
                        >
                          {product.buttonText || "Get Free Download"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No products available yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
