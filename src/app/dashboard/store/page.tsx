import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoreManager } from "@/components/dashboard/StoreManager";
import Link from "next/link";
import { Instagram, Twitter, Music, Youtube, Link as LinkIcon, Linkedin, Github, Facebook, Twitch } from "lucide-react";

export default async function StorePage() {
  const user = await requireAuth();

  // Get user's social links
  const socialLinks = await prisma.socialLink.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
  });

  // Get user's products
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Helper function to get social icon
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return { icon: Instagram, bg: "bg-gradient-to-tr from-purple-400 to-pink-400" };
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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Store</h1>
          <p className="text-gray-600">Manage your profile and products.</p>
        </div>

        {/* Profile Overview - Clickable */}
        <Link href="/dashboard/profile" className="block mb-6">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              {user.dbUser.avatar ? (
                <img
                  src={user.dbUser.avatar}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl text-gray-500">
                    {(user.dbUser.fullName || user.dbUser.username)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.dbUser.fullName || user.dbUser.username}
                </h3>
                <p className="text-gray-600">@{user.dbUser.username}</p>
              </div>
              <div className="flex items-center text-gray-400">
                <span className="text-sm">→</span>
              </div>
            </div>

            {/* Social Links Display */}
            {socialLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {socialLinks.map((link) => {
                    const { icon: IconComponent, bg } = getSocialIcon(link.platform);
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

        <StoreManager
          user={user}
          socialLinks={socialLinks}
          initialProducts={products.map((product) => ({
            ...product,
            price: product.price.toString(),
            isDraft: product.isDraft,
            isActive: product.isActive,
          }))}
        />

        {/* Add Product Button */}
        <Link href="/dashboard/store/choose-product" className="block mt-6">
          <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 my-auto cursor-pointer">
            + Add Product
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
