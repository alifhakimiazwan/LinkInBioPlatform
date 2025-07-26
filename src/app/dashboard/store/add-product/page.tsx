import { ProductEditor } from "@/components/dashboard/ProductEditor";
import { LeadMagnetCreator } from "@/components/dashboard/LeadMagnetCreator";
import { DigitalProductCreator } from "@/components/dashboard/DigitalProductCreator";
import { WebinarCreator } from "@/components/dashboard/WebinarCreator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ type?: string; draftId?: string }>;
}

export default async function AddProductPage({ searchParams }: PageProps) {
  const { type: productType, draftId } = await searchParams;

  // Determine page title and description based on product type
  const getPageInfo = () => {
    switch (productType) {
      case "FREE_LEAD":
        return {
          title: draftId ? "Edit Lead Magnet" : "Create Lead Magnet",
          description: draftId
            ? "Edit your lead magnet settings and content."
            : "Build a free resource to collect customer information and grow your email list.",
        };
      case "DIGITAL":
        return {
          title: draftId ? "Edit Digital Product" : "Create Digital Product",
          description: draftId
            ? "Edit your digital product settings and content."
            : "Create a digital product like e-books, courses, or templates to sell on your bio page.",
        };
      case "WEBINAR":
        return {
          title: draftId ? "Edit Webinar" : "Create Webinar",
          description: draftId
            ? "Edit your webinar settings and registration details."
            : "Create a webinar to sell live training sessions on your bio page.",
        };
      default:
        return {
          title: "Add Product",
          description: "Create a new product to sell on your bio page.",
        };
    }
  };

  const { title, description } = getPageInfo();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/store">
            <Button
              size="sm"
              className="cursor-pointer hover:text-orange-600 shadow-none"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
      </div>

      {productType === "FREE_LEAD" ? (
        <LeadMagnetCreator draftId={draftId} />
      ) : productType === "DIGITAL" ? (
        <DigitalProductCreator draftId={draftId} />
      ) : productType === "WEBINAR" ? (
        <WebinarCreator draftId={draftId} />
      ) : (
        <div className="max-w-4xl">
          <ProductEditor preselectedType={productType} />
        </div>
      )}
    </div>
  );
}
