import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { MobilePreview } from "@/components/dashboard/MobilePreview";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfileEditPage() {
  const user = await requireAuth();

  // Get user's social links
  const socialLinks = await prisma.socialLink.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/store">
              <Button size="sm">←</Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600">
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
    </DashboardLayout>
  );
}
