"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/step-indicator";
import {
  Camera,
  ChevronDown,
  Upload,
  Save,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  uploadFile,
  validateImageFile,
  validateProductFile,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import {
  saveDraftAction,
  updateDraftAction,
  loadDraftAction,
  finalizeDraftAction,
} from "@/app/dashboard/store/draft-actions";
import Image from "next/image";

interface FormField {
  id: string;
  type: "name" | "email" | "phone" | "text";
  label: string;
  required: boolean;
}

interface DigitalProductData {
  style: "button" | "callout" | "";
  image?: string;
  title: string;
  subtitle?: string; // Only for callout style
  buttonText?: string; // Only for callout style
  price: string;
  // Checkout page data
  checkoutImage?: string;
  description: string; // Rich text description
  ctaButtonText: string;
  collectFields: FormField[];
  // Delivery data
  deliveryType: "upload" | "redirect";
  fileUpload?: File;
  fileUrl?: string;
  fileName?: string;
  redirectUrl?: string;
}

interface DigitalProductCreatorProps {
  draftId?: string;
}

export function DigitalProductCreator({
  draftId,
}: DigitalProductCreatorProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [checkoutImageFile, setCheckoutImageFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [checkoutImagePreview, setCheckoutImagePreview] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(
    draftId || null
  );
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const [productData, setProductData] = useState<DigitalProductData>({
    style: "",
    title: "",
    subtitle: "",
    buttonText: "Buy Now",
    price: "",
    // Checkout page defaults
    description: "",
    ctaButtonText: "Purchase Now",
    collectFields: [
      { id: "1", type: "name", label: "Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
    ],
    // Delivery defaults
    deliveryType: "upload",
    fileUpload: undefined,
    fileUrl: "",
    fileName: "",
    redirectUrl: "",
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const checkoutImageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Load draft data if editing
  useEffect(() => {
    if (draftId) {
      loadDraftData();
    }
  }, [draftId]);

  const loadDraftData = async () => {
    if (!draftId) return;

    setLoading(true);
    try {
      const result = await loadDraftAction(draftId);

      if (result.success && result.draft) {
        const draft = result.draft;
        setIsEditing(true);

        // Parse digital product data from formFields
        let digitalData: Record<string, unknown> = {};
        try {
          if (draft.formFields) {
            // formFields is already parsed by Prisma, no need to JSON.parse again
            digitalData =
              typeof draft.formFields === "string"
                ? JSON.parse(draft.formFields)
                : draft.formFields;
          }
        } catch (error) {
          console.error("Error parsing draft formFields:", error);
        }

        // Load draft data
        setProductData({
          style: (digitalData?.style as "button" | "callout") || "button",
          title: draft.title || "",
          subtitle: draft.subtitle || "",
          buttonText: draft.buttonText || "Buy Now",
          price: draft.price || "0",
          description: digitalData?.description || "",
          ctaButtonText: digitalData?.ctaButtonText || "Purchase Now",
          collectFields: digitalData?.collectFields || [
            { id: "1", type: "name", label: "Name", required: true },
            { id: "2", type: "email", label: "Email", required: true },
          ],
          deliveryType:
            (draft.deliveryType as "upload" | "redirect") || "upload",
          fileUrl: draft.fileUrl || "",
          fileName: draft.fileName || "",
          redirectUrl: draft.redirectUrl || "",
        });

        // Set image previews if they exist
        if (draft.imageUrl) {
          setImagePreview(draft.imageUrl);
        }

        // Set checkout image preview if it exists
        if (digitalData.checkoutImageUrl) {
          setCheckoutImagePreview(digitalData.checkoutImageUrl);
        } else if (draft.imageUrl) {
          // Fallback to main image if no separate checkout image
          setCheckoutImagePreview(draft.imageUrl);
        }

        // Set current step from draft
        setCurrentStep(draft.currentStep || 1);
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCheckoutImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setCheckoutImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCheckoutImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProductFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateProductFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setProductFile(file);
    setProductData((prev) => ({
      ...prev,
      fileName: file.name,
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromStep1 =
    productData.style !== "" &&
    productData.title.trim() !== "" &&
    productData.price.trim() !== "";
  const canProceedFromStep2 =
    productData.description.trim() !== "" &&
    productData.ctaButtonText.trim() !== "";
  const canCreateProduct =
    productData.deliveryType === "upload"
      ? productFile || productData.fileUrl
      : productData.redirectUrl?.trim();

  // Field management functions for step 2
  const addField = (type: FormField["type"]) => {
    const getFieldDefaults = (fieldType: FormField["type"]) => {
      switch (fieldType) {
        case "phone":
          return { label: "Phone Number" };
        case "text":
          return { label: "Message" };
        default:
          return {
            label: fieldType.charAt(0).toUpperCase() + fieldType.slice(1),
          };
      }
    };

    const { label } = getFieldDefaults(type);

    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label,
      required: false,
    };

    setProductData((prev) => ({
      ...prev,
      collectFields: [...prev.collectFields, newField],
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setProductData((prev) => ({
      ...prev,
      collectFields: prev.collectFields.map((field) => {
        if (field.id === fieldId) {
          // Don't allow changing the type or core properties of name and email fields
          if (fieldId === "1" || fieldId === "2") {
            return { ...field, label: updates.label || field.label };
          }
          return { ...field, ...updates };
        }
        return field;
      }),
    }));
  };

  const removeField = (fieldId: string) => {
    // Don't allow removing name and email fields
    if (fieldId === "1" || fieldId === "2") return;

    setProductData((prev) => ({
      ...prev,
      collectFields: prev.collectFields.filter((field) => field.id !== fieldId),
    }));
  };

  // Save draft functionality
  const handleSaveDraft = async () => {
    setSaving(true);

    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();

      // Basic product info
      formData.append("title", productData.title);
      formData.append("subtitle", productData.subtitle || ""); // Store callout subtitle
      formData.append(
        "buttonText",
        productData.buttonText || productData.ctaButtonText
      );
      formData.append("productType", "DIGITAL");
      formData.append("currentStep", currentStep.toString());
      formData.append("price", productData.price);

      // Store digital product specific data in formFields
      const digitalProductData = {
        style: productData.style,
        description: productData.description,
        ctaButtonText: productData.ctaButtonText,
        collectFields: productData.collectFields,
        checkoutImageUrl: checkoutImagePreview,
      };
      formData.append("formFields", JSON.stringify(digitalProductData));

      // Delivery info
      formData.append("deliveryType", productData.deliveryType);
      formData.append("redirectUrl", productData.redirectUrl || "");

      // File uploads
      if (imageFile) {
        const imageResult = await uploadFile(
          imageFile,
          "products",
          "images",
          userId
        );
        formData.append("imageUrl", imageResult.url);
      } else if (imagePreview) {
        formData.append("imageUrl", imagePreview);
      }

      // Handle checkout image upload separately
      if (checkoutImageFile) {
        const checkoutImageResult = await uploadFile(
          checkoutImageFile,
          "products",
          "images",
          userId
        );
        // Update the digitalProductData with the new checkout image URL
        const updatedDigitalData = {
          style: productData.style,
          description: productData.description,
          ctaButtonText: productData.ctaButtonText,
          collectFields: productData.collectFields,
          checkoutImageUrl: checkoutImageResult.url,
        };
        formData.set("formFields", JSON.stringify(updatedDigitalData));
      }

      if (productFile) {
        const fileResult = await uploadFile(
          productFile,
          "products",
          "files",
          userId
        );
        formData.append("fileUrl", fileResult.url);
        formData.append("fileName", productFile.name);
      } else if (productData.fileUrl) {
        formData.append("fileUrl", productData.fileUrl);
        formData.append("fileName", productData.fileName || "");
      }

      let result;
      if (isEditing && currentDraftId) {
        formData.append("productId", currentDraftId);
        result = await updateDraftAction(formData);
      } else {
        result = await saveDraftAction(formData);
        if (result.success && result.productId) {
          setCurrentDraftId(result.productId);
          setIsEditing(true);
        }
      }

      if (result.success) {
        // Show success message or redirect
        router.push("/dashboard/store");
      } else {
        console.error("Failed to save draft:", result.error);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setSaving(false);
    }
  };

  // Create product functionality
  const handleCreateProduct = async () => {
    setFinalizing(true);

    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();

      // Basic product info
      formData.append("title", productData.title);
      formData.append("subtitle", productData.subtitle || ""); // Store callout subtitle
      formData.append(
        "buttonText",
        productData.buttonText || productData.ctaButtonText
      );
      formData.append("productType", "DIGITAL");
      formData.append("price", productData.price);

      // Store digital product specific data in formFields
      const digitalProductData = {
        style: productData.style,
        description: productData.description,
        ctaButtonText: productData.ctaButtonText,
        collectFields: productData.collectFields,
        checkoutImageUrl: checkoutImagePreview,
      };
      formData.append("formFields", JSON.stringify(digitalProductData));

      // Delivery info
      formData.append("deliveryType", productData.deliveryType);
      formData.append("redirectUrl", productData.redirectUrl || "");

      // File uploads
      let imageUrl = imagePreview;
      if (imageFile) {
        const imageResult = await uploadFile(
          imageFile,
          "products",
          "images",
          userId
        );
        imageUrl = imageResult.url;
      }
      if (imageUrl) {
        formData.append("imageUrl", imageUrl);
      }

      // Handle checkout image upload separately
      if (checkoutImageFile) {
        const checkoutImageResult = await uploadFile(
          checkoutImageFile,
          "products",
          "images",
          userId
        );
        // Update the digitalProductData with the new checkout image URL
        const updatedDigitalData = {
          style: productData.style,
          description: productData.description,
          ctaButtonText: productData.ctaButtonText,
          collectFields: productData.collectFields,
          checkoutImageUrl: checkoutImageResult.url,
        };
        formData.set("formFields", JSON.stringify(updatedDigitalData));
      }

      let fileUrl = productData.fileUrl;
      let fileName = productData.fileName;
      if (productFile) {
        const fileResult = await uploadFile(
          productFile,
          "products",
          "files",
          userId
        );
        fileUrl = fileResult.url;
        fileName = productFile.name;
      }
      if (fileUrl) {
        formData.append("fileUrl", fileUrl);
        formData.append("fileName", fileName || "");
      }

      let result;
      if (isEditing && currentDraftId) {
        // Finalize existing draft
        formData.append("productId", currentDraftId);
        result = await finalizeDraftAction(formData);
      } else {
        // Create new product directly (not as draft)
        const createFormData = new FormData();
        createFormData.append("title", productData.title);
        createFormData.append("subtitle", productData.subtitle || "");
        createFormData.append(
          "buttonText",
          productData.buttonText || productData.ctaButtonText
        );
        createFormData.append("deliveryType", productData.deliveryType);
        createFormData.append("redirectUrl", productData.redirectUrl || "");
        createFormData.append("formFields", JSON.stringify(digitalProductData));
        createFormData.append("productType", "DIGITAL");
        createFormData.append("price", productData.price);
        createFormData.append("imageUrl", imageUrl || "");
        createFormData.append("fileUrl", fileUrl || "");
        createFormData.append("fileName", fileName || "");
        createFormData.append("currentStep", "3"); // Final step

        // Save as draft first, then finalize it
        const draftResult = await saveDraftAction(createFormData);
        if (draftResult.success && draftResult.productId) {
          const finalizeFormData = new FormData();
          finalizeFormData.append("productId", draftResult.productId);
          finalizeFormData.append("title", productData.title);
          finalizeFormData.append("subtitle", productData.subtitle || "");
          finalizeFormData.append(
            "buttonText",
            productData.buttonText || productData.ctaButtonText
          );
          finalizeFormData.append("deliveryType", productData.deliveryType);
          finalizeFormData.append("redirectUrl", productData.redirectUrl || "");
          finalizeFormData.append(
            "formFields",
            JSON.stringify(digitalProductData)
          );
          finalizeFormData.append("imageUrl", imageUrl || "");
          finalizeFormData.append("fileUrl", fileUrl || "");
          finalizeFormData.append("fileName", fileName || "");

          result = await finalizeDraftAction(finalizeFormData);
        } else {
          result = draftResult;
        }
      }

      if (result.success) {
        // Redirect back to My Store
        router.push("/dashboard/store");
      } else {
        console.error("Failed to create digital product:", result.error);
        alert("Failed to create digital product. Please try again.");
      }
    } catch (error) {
      console.error("Error creating digital product:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create digital product. Please try again."
      );
    } finally {
      setFinalizing(false);
    }
  };

  // Step 1: Combined Style Selection and Product Details with Live Preview
  const renderProductSetup = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT SIDE - Form */}
      <div className="space-y-6">
        {/* Style Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <span className="text-orange-600 rounded-full bg-orange-50 px-3 py-1 text-md mr-3">
              1
            </span>{" "}
            Choose Your Product Style
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Button Style */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                productData.style === "button"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setProductData((prev) => ({ ...prev, style: "button" }))
              }
            >
              <div className="flex items-center space-x-3">
                <Image src="/button.svg" alt="Button" width={60} height={60} />
                <div>
                  <h4 className="font-semibold text-gray-900">Button Style</h4>
                  <p className="text-xs text-gray-400">Simple button layout</p>
                </div>
              </div>
            </div>

            {/* Callout Style */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all text-sm ${
                productData.style === "callout"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setProductData((prev) => ({ ...prev, style: "callout" }))
              }
            >
              <div className="flex items-center space-x-3">
                <Image
                  src="/callout.svg"
                  alt="Callout"
                  width={60}
                  height={60}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">Callout Style</h4>
                  <p className="text-xs text-gray-400">Card with details</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details - Only show if style is selected */}
        {productData.style && (
          <>
            {/* Product Image */}
            <div className="text-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Thumbnail *
              </label>
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Upload Icon Button */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-600 hover:bg-orange-700 cursor-pointer rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <Upload className="w-4 h-4 text-white" />
                </button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {imageFile && (
                <p className="text-xs text-green-600 mt-2">
                  Selected: {imageFile.name}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="text-sm">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product Title *
              </label>
              <input
                type="text"
                id="title"
                value={productData.title}
                onChange={(e) =>
                  setProductData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter product title"
              />
            </div>

            {/* Subtitle - Only for callout style */}
            {productData.style === "callout" && (
              <div className="text-sm">
                <label
                  htmlFor="subtitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subtitle
                </label>
                <input
                  type="text"
                  id="subtitle"
                  value={productData.subtitle}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      subtitle: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Brief description of your product"
                />
              </div>
            )}

            {/* Price */}
            <div className="text-sm">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="price"
                  value={productData.price}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Button Text - Only for callout style */}
            {productData.style === "callout" && (
              <div className="text-sm">
                <label
                  htmlFor="buttonText"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Button Text
                </label>
                <input
                  type="text"
                  id="buttonText"
                  value={productData.buttonText}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      buttonText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Buy Now"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT SIDE - Live Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            Live Preview
          </h4>

          {!productData.style ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">📱</span>
              <p className="text-sm">Select a style to see preview</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {productData.style === "button" ? (
                // Button Style Preview
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm text-gray-900">
                      {productData.title || "Product Title"}
                    </div>
                    <div className="text-orange-600 font-semibold text-sm">
                      ${productData.price || "0.00"}
                    </div>
                  </div>
                </div>
              ) : (
                // Callout Style Preview
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm text-gray-900">
                        {productData.title || "Product Title"}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {productData.subtitle || "Product subtitle description"}
                      </div>
                      <div className="text-orange-600 font-semibold text-sm">
                        ${productData.price || "0.00"}
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-orange-600 text-white text-xs py-2 rounded">
                    {productData.buttonText || "Buy Now"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Helper function to render description with basic markdown
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith("•")) {
        return (
          <div key={index} className="flex items-start space-x-2 mb-1">
            <span className="text-orange-600 mt-1">•</span>
            <span className="flex-1 text-sm text-gray-700">
              {line.replace("•", "").trim()}
            </span>
          </div>
        );
      }

      // Handle bold and italic (simple version)
      const formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" class="text-orange-600 underline">$1</a>'
        );

      return (
        <p
          key={index}
          className="text-sm text-gray-700 mb-2"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  // Step 2: Checkout Page with Mobile Preview
  const renderCheckoutPage = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT SIDE - Form */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Checkout Page
          </h3>
          <p className="text-gray-600 mb-6">
            Design the page customers will see when purchasing your product.
          </p>
        </div>

        {/* Checkout Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image for Checkout
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              {checkoutImagePreview ? (
                <img
                  src={checkoutImagePreview}
                  alt="Checkout Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                ref={checkoutImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleCheckoutImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="mb-2"
                onClick={() => checkoutImageInputRef.current?.click()}
              >
                {checkoutImageFile ? "Change Image" : "Upload Image"}
              </Button>
              {checkoutImageFile && (
                <p className="text-xs text-green-600 mb-1">
                  Selected: {checkoutImageFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                JPG, PNG or GIF. Max size 5MB. Recommended: 600x400px
              </p>
            </div>
          </div>
        </div>

        {/* Product Description - Rich Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Description *
          </label>
          <div className="border border-gray-300 rounded-md">
            {/* Simple Rich Text Toolbar */}
            <div className="border-b border-gray-200 p-2 flex space-x-2">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  // Simple bold toggle - for MVP we'll use basic formatting
                  const textarea = document.getElementById(
                    "description"
                  ) as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = textarea.value.substring(start, end);
                    const newText = `**${selectedText}**`;
                    const newValue =
                      textarea.value.substring(0, start) +
                      newText +
                      textarea.value.substring(end);
                    setProductData((prev) => ({
                      ...prev,
                      description: newValue,
                    }));
                  }
                }}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  const textarea = document.getElementById(
                    "description"
                  ) as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = textarea.value.substring(start, end);
                    const newText = `*${selectedText}*`;
                    const newValue =
                      textarea.value.substring(0, start) +
                      newText +
                      textarea.value.substring(end);
                    setProductData((prev) => ({
                      ...prev,
                      description: newValue,
                    }));
                  }
                }}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  const textarea = document.getElementById(
                    "description"
                  ) as HTMLTextAreaElement;
                  if (textarea) {
                    const cursorPos = textarea.selectionStart;
                    const newText = "• ";
                    const newValue =
                      textarea.value.substring(0, cursorPos) +
                      newText +
                      textarea.value.substring(cursorPos);
                    setProductData((prev) => ({
                      ...prev,
                      description: newValue,
                    }));
                  }
                }}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  const textarea = document.getElementById(
                    "description"
                  ) as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText =
                      textarea.value.substring(start, end) || "link text";
                    const newText = `[${selectedText}](https://example.com)`;
                    const newValue =
                      textarea.value.substring(0, start) +
                      newText +
                      textarea.value.substring(end);
                    setProductData((prev) => ({
                      ...prev,
                      description: newValue,
                    }));
                  }
                }}
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
            <textarea
              id="description"
              value={productData.description}
              onChange={(e) =>
                setProductData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 min-h-[120px] border-0 focus:outline-none focus:ring-0 resize-none"
              placeholder="Describe your product in detail. Use **bold**, *italic*, • bullet points, and [links](url) for formatting."
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use **bold**, *italic*, • for bullets, [text](url) for links
          </p>
        </div>

        {/* CTA Button Text */}
        <div>
          <label
            htmlFor="ctaButtonText"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Call-to-Action Button Text *
          </label>
          <input
            type="text"
            id="ctaButtonText"
            value={productData.ctaButtonText}
            onChange={(e) =>
              setProductData((prev) => ({
                ...prev,
                ctaButtonText: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Purchase Now"
          />
        </div>

        {/* Collect Customer Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Collect Customer Information
          </label>
          <div className="space-y-4">
            {productData.collectFields.map((field) => {
              const isDefaultField = field.id === "1" || field.id === "2";
              return (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 text-sm font-medium">
                          {field.type === "name"
                            ? "👤"
                            : field.type === "email"
                            ? "📧"
                            : field.type === "phone"
                            ? "📞"
                            : field.type === "text"
                            ? "📝"
                            : "❓"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {field.label}
                        </span>
                        {isDefaultField && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Required)
                          </span>
                        )}
                      </div>
                    </div>
                    {!isDefaultField && (
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addField(e.target.value as FormField["type"]);
                    e.target.value = "";
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
              >
                <option value="">+ Add Field</option>
                <option value="phone">Phone Number</option>
                <option value="text">Text Field</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Mobile Checkout Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            Checkout Page Preview
          </h4>

          <div className="mx-auto max-w-sm">
            <div className="bg-black rounded-[2.5rem] p-2">
              <div className="bg-white rounded-[2rem] h-[650px] overflow-y-auto scrollbar-hide">
                <div className="p-6">
                  {/* Back Button */}
                  <div className="flex items-center mb-4">
                    <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Back</span>
                    </button>
                  </div>

                  {/* Product Image */}
                  <div className="mb-6">
                    {checkoutImagePreview ? (
                      <img
                        src={checkoutImagePreview}
                        alt="Product"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    {productData.title || "Product Title"}
                  </h1>

                  {/* Price */}
                  <div className="text-2xl font-bold text-orange-600 mb-4">
                    ${productData.price || "0.00"}
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    {productData.description ? (
                      <div className="space-y-2">
                        {renderFormattedText(productData.description)}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        Product description will appear here...
                      </p>
                    )}
                  </div>

                  {/* Customer Info Collection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Your Information
                    </h3>
                    <div className="space-y-3">
                      {productData.collectFields.map((field) => (
                        <div key={field.id}>
                          {field.type !== "name" && field.type !== "email" && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
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
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 cursor-not-allowed"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    disabled
                    className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    {productData.ctaButtonText || "Purchase Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Delivery Method
  const renderDeliveryMethod = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Product Delivery
        </h3>
        <p className="text-gray-600 mb-6">
          Choose how customers will receive your digital product after purchase.
        </p>
      </div>

      {/* Delivery Type Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Delivery Method
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload File Option */}
          <div
            onClick={() =>
              setProductData((prev) => ({ ...prev, deliveryType: "upload" }))
            }
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              productData.deliveryType === "upload"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  productData.deliveryType === "upload"
                    ? "bg-orange-100"
                    : "bg-gray-100"
                }`}
              >
                <Upload
                  className={`w-5 h-5 ${
                    productData.deliveryType === "upload"
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Upload File</h3>
                <p className="text-sm text-gray-500">
                  Upload a PDF, document, or digital file
                </p>
              </div>
            </div>
          </div>

          {/* Redirect URL Option */}
          <div
            onClick={() =>
              setProductData((prev) => ({ ...prev, deliveryType: "redirect" }))
            }
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              productData.deliveryType === "redirect"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  productData.deliveryType === "redirect"
                    ? "bg-orange-100"
                    : "bg-gray-100"
                }`}
              >
                <LinkIcon
                  className={`w-5 h-5 ${
                    productData.deliveryType === "redirect"
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Redirect to URL</h3>
                <p className="text-sm text-gray-500">
                  Redirect to a website or download link
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on Selection */}
      {productData.deliveryType === "upload" ? (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Upload Your File
          </label>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {productFile || productData.fileUrl ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {productFile
                        ? productFile.name
                        : productData.fileName || "Uploaded file"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {productFile
                        ? `${(productFile.size / 1024 / 1024).toFixed(2)} MB`
                        : productData.fileUrl
                        ? "Saved to storage"
                        : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Upload className="mx-auto w-12 h-12 text-gray-400" />
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, DOC, ZIP or any file up to 50MB
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleProductFileUpload}
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.epub,.mp3,.mp4,.png,.jpg,.jpeg"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Redirect URL
          </label>
          <input
            type="url"
            value={productData.redirectUrl || ""}
            onChange={(e) =>
              setProductData((prev) => ({
                ...prev,
                redirectUrl: e.target.value,
              }))
            }
            placeholder="https://example.com/download-link"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <p className="text-sm text-gray-500">
            Customers will be redirected to this URL after purchase.
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <StepIndicator currentStep={currentStep} totalSteps={3} color="orange" />

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        {currentStep === 1 && renderProductSetup()}
        {currentStep === 2 && renderCheckoutPage()}
        {currentStep === 3 && renderDeliveryMethod()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center cursor-pointer space-x-2 border border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white shadow-none"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex items-center cursor-pointer space-x-2 border border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white shadow-none"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Draft"}</span>
        </Button>
        {currentStep < 3 ? (
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !canProceedFromStep1) ||
              (currentStep === 2 && !canProceedFromStep2)
            }
            className="flex items-center space-x-2 text-sm shadow-none bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
          >
            <span>Next</span> <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateProduct}
            disabled={!canCreateProduct || finalizing}
            className="flex items-center space-x-2 text-sm shadow-none bg-orange-600 text-white hover:bg-orange-700 cursor-pointer"
          >
            {finalizing ? "Creating..." : "Create Product"}
          </Button>
        )}
      </div>
    </div>
  );
}
