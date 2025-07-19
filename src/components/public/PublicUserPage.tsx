"use client";

import { useState } from "react";
import { Instagram, Twitter, Music, Youtube, Link, Linkedin, Github, Facebook, Twitch, Camera } from "lucide-react";

interface FormField {
  id: string;
  type: "name" | "email" | "phone" | "text";
  label: string;
  required: boolean;
}

interface Product {
  id: string;
  title: string;
  subtitle?: string | null;
  buttonText?: string | null;
  imageUrl?: string | null;
  type: string;
  isActive: boolean;
  isDraft: boolean;
  formFields?: FormField[] | any;
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

export function PublicUserPage({ user, socialLinks, products }: PublicUserPageProps) {
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});

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

  const handleInputChange = (productId: string, fieldId: string, value: string) => {
    setFormData(prev => ({
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

    // Handle form submission based on delivery type
    if (product.deliveryType === 'redirect' && product.redirectUrl) {
      // Redirect to URL
      window.open(product.redirectUrl, '_blank');
    } else {
      // Handle file download or other delivery methods
      console.log('Form submitted:', { productId, data });
      alert('Thank you! Your download will start shortly.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-sm mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 text-center">
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
                const { icon: IconComponent, bg } = getSocialIcon(link.platform);
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
            <div className="space-y-6">
              {products.map((product) => (
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
                    {product.type === 'FREE_LEAD' && product.formFields ? (
                      (product.formFields as FormField[]).map((field) => (
                        <div key={field.id}>
                          {/* Show label only for non-name and non-email fields */}
                          {field.type !== "name" && field.type !== "email" && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}{" "}
                              {field.required && (
                                <span className="text-red-500">*</span>
                              )}
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
                            value={formData[product.id]?.[field.id] || ""}
                            onChange={(e) =>
                              handleInputChange(product.id, field.id, e.target.value)
                            }
                            required={field.required}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                              handleInputChange(product.id, "name", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            placeholder="Enter your email"
                            value={formData[product.id]?.["email"] || ""}
                            onChange={(e) =>
                              handleInputChange(product.id, "email", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => handleSubmit(product.id, product)}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      {product.buttonText || 'Get Free Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Powered by LinkBio Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}