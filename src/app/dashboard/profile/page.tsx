import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { MobilePreview } from "@/components/dashboard/MobilePreview";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const user = await requireAuth();

  // Get user's social links
  const socialLinks = await prisma.socialLink.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/store">
            <Button
              size="sm"
              className="cursor-pointer shadow-none transition-all  hover:text-orange-400"
            >
              <ArrowLeft className="w-16 h-16" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-400 text-sm">
              Customize your profile information and social links.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Profile Editor */}
        <div className="space-y-6">
          <ProfileEditor user={user} socialLinks={socialLinks} />
        </div>

        {/* Right side - Mobile Preview */}
        <div className="lg:sticky lg:top-6">
          <MobilePreview user={user} socialLinks={socialLinks} />
        </div>
      </div>
    </div>
  );
}
