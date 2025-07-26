import { prisma } from "@/lib/prisma";
import { StorePageClient } from "@/components/dashboard/StorePageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export default async function StorePage() {
  // Auth is handled by layout.tsx - get user from auth cookie
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Unauthorized");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      avatar: true,
      bio: true,
    },
  });

  const user = { ...authUser, dbUser };

  // Fallback if dbUser is null
  if (!dbUser) {
    throw new Error("User not found in database");
  }

  // Get user's data in parallel for better performance
  const [socialLinks, products] = await Promise.all([
    prisma.socialLink.findMany({
      where: { userId: authUser.id },
      orderBy: { position: "asc" },
      select: {
        platform: true,
        url: true,
        position: true,
        isActive: true,
      },
    }),
    prisma.product.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        price: true,
        type: true,
        imageUrl: true,
        isDraft: true,
        isActive: true,
        subtitle: true,
        buttonText: true,
        formFields: true,
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <PageHeader 
        title="My Store" 
        description="Manage your profile and products."
        username={user.dbUser?.username || ''}
      />

      <StorePageClient
        user={user}
        socialLinks={socialLinks}
        initialProducts={products.map((product) => ({
          ...product,
          price: product.price.toString(),
          isDraft: product.isDraft,
          isActive: product.isActive,
        }))}
      />
    </div>
  );
}
