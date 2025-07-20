"use client";

import { useState } from "react";
import { StoreManager } from "./StoreManager";
import { MobilePreview } from "./MobilePreview";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Instagram,
  Twitter,
  Music,
  Youtube,
  Link as LinkIcon,
  Linkedin,
  Github,
  Facebook,
  Twitch,
} from "lucide-react";

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
  email?: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface StorePageClientProps {
  user: User;
  socialLinks: SocialLink[];
  initialProducts: Product[];
}

export function StorePageClient({ user, socialLinks, initialProducts }: StorePageClientProps) {
  const [products, setProducts] = useState(initialProducts);

  // Helper function to get social icon
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
        return { icon: LinkIcon, bg: "bg-gray-400" };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN - Profile, Store Manager, Add Button */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Overview */}
        <Link href="/dashboard/profile">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              {user.dbUser?.avatar ? (
                <img
                  src={user.dbUser.avatar}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl text-gray-500">
                    {(
                      user.dbUser?.fullName ||
                      user.dbUser?.username ||
                      user.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.dbUser?.fullName ||
                    user.dbUser?.username ||
                    user.email}
                </h3>
                <p className="text-gray-600">
                  @{user.dbUser?.username || "user"}
                </p>
              </div>
              <div className="flex items-center text-gray-400">
                <span className="text-sm">→</span>
              </div>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {socialLinks.map((link) => {
                    const { icon: IconComponent, bg } = getSocialIcon(
                      link.platform
                    );
                    return (
                      <div
                        key={link.platform}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}
                      >
                        <IconComponent className="w-3 h-3 text-white" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Store Manager - Products */}
        <StoreManager
          user={user}
          socialLinks={socialLinks}
          initialProducts={products}
          onProductsChange={setProducts}
        />

        {/* Add Product Button */}
        <Link href="/dashboard/store/choose-product">
          <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2">
            + Add Product
          </Button>
        </Link>
      </div>

      {/* RIGHT COLUMN - Mobile Preview */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-6">
          <MobilePreview
            user={user}
            socialLinks={socialLinks}
            products={products}
          />
        </div>
      </div>
    </div>
  );
}