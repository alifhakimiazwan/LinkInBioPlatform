import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PublicUserPage } from "@/components/public/PublicUserPage";

interface PageProps {
  params: Promise<{ username: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      fullName: true,
      username: true,
      bio: true,
      avatar: true,
    },
  });

  if (!user) {
    return {
      title: "User not found",
    };
  }

  const displayName = user.fullName || user.username;
  const description = user.bio || `Check out ${displayName}'s link in bio page`;

  return {
    title: `${displayName} (@${user.username})`,
    description,
    openGraph: {
      title: `${displayName} (@${user.username})`,
      description,
      images: user.avatar ? [{ url: user.avatar }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} (@${user.username})`,
      description,
      images: user.avatar ? [user.avatar] : [],
    },
  };
}

export default async function UserPage({ params }: PageProps) {
  const { username } = await params;

  // Get user data
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      fullName: true,
      username: true,
      bio: true,
      avatar: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Get user's social links
  const socialLinks = await prisma.socialLink.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
    select: {
      platform: true,
      url: true,
    },
  });

  // Get user's active products (not drafts)
  const products = await prisma.product.findMany({
    where: { 
      userId: user.id,
      isActive: true,
      isDraft: false,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      buttonText: true,
      imageUrl: true,
      type: true,
      price: true,
      formFields: true,
      deliveryType: true,
      redirectUrl: true,
    },
  });

  return (
    <PublicUserPage
      user={{
        fullName: user.fullName,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
      }}
      socialLinks={socialLinks}
      products={products.map(product => ({
        ...product,
        price: product.price ? Number(product.price) : 0,
        isActive: true,
        isDraft: false,
      }))}
    />
  );
}