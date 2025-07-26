import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Video, Calendar, Gift, ArrowLeft } from "lucide-react";

export default async function ChooseProductPage() {
  const productTypes = [
    {
      type: "DIGITAL",
      icon: Download,
      title: "Digital Products",
      description:
        "Sell downloadable content like e-books, guides, templates, courses, or any digital files.",
    },
    {
      type: "COACHING",
      icon: Calendar,
      title: "Coaching Call",
      description:
        "Offer one-on-one coaching sessions, consultations, or personalized advice calls.",
    },
    {
      type: "WEBINAR",
      icon: Video,
      title: "Webinar",
      description:
        "Host live or recorded educational sessions, workshops, or group training events.",
    },
    {
      type: "FREE_LEAD",
      icon: Gift,
      title: "Free Product (Lead Magnet)",
      description:
        "Collect customer information in exchange for free valuable content or resources.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
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
            <h1 className="text-2xl font-bold text-gray-900">
              Choose Product Type
            </h1>
            <p className="text-gray-400 text-sm ">
              Select the type of product you want to create and sell.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {productTypes.map((product) => {
          const IconComponent = product.icon;
          return (
            <Link
              key={product.type}
              href={`/dashboard/store/add-product?type=${product.type}`}
              className="block"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:scale-105 hover:border-orange-300 transition-all cursor-pointer">
                <div className="flex items-start space-x-4">
                  {/* Icon Thumbnail */}
                  <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-orange-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Help Section
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Need help choosing?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Digital Products</h4>
            <p className="text-gray-600">
              Perfect for selling e-books, courses, templates, or any
              downloadable content with instant delivery.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Coaching & Webinars
            </h4>
            <p className="text-gray-600">
              Ideal for service-based offerings like personal coaching sessions
              or educational webinars.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Lead Generation</h4>
            <p className="text-gray-600">
              Use free products to collect customer information and build your
              email list for future marketing.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Getting Started</h4>
            <p className="text-gray-600">
              New to selling? Start with digital products or free lead magnets
              to build your audience first.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}
