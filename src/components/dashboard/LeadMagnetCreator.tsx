"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, ChevronDown, Upload, Link, FileText, Save } from "lucide-react";
import { saveDraftAction, updateDraftAction, loadDraftAction, finalizeDraftAction } from "@/app/dashboard/store/draft-actions";
import { useRouter } from "next/navigation";
import { uploadFile, validateImageFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

interface FormField {
  id: string;
  type: "name" | "email" | "phone" | "text" | "mcq" | "dropdown";
  label: string;
  required: boolean;
  options?: string[]; // For MCQ and dropdown
}

interface LeadMagnetData {
  image?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  fields: FormField[];
  deliveryType: 'upload' | 'redirect';
  fileUpload?: File;
  fileUrl?: string; // For saved files
  fileName?: string; // Original filename for display
  redirectUrl?: string;
}

interface LeadMagnetCreatorProps {
  draftId?: string;
}

export function LeadMagnetCreator({ draftId }: LeadMagnetCreatorProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [leadMagnetData, setLeadMagnetData] = useState<LeadMagnetData>({
    title: "",
    subtitle: "",
    buttonText: "Get Free Download",
    fields: [
      { id: "1", type: "name", label: "Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
    ],
    deliveryType: 'upload',
    fileUpload: undefined,
    fileUrl: '',
    fileName: '',
    redirectUrl: '',
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        // Load draft data
        setLeadMagnetData({
          title: draft.title || "",
          subtitle: draft.subtitle || "",
          buttonText: draft.buttonText || "Get Free Download",
          fields: draft.formFields || [
            { id: "1", type: "name", label: "Name", required: true },
            { id: "2", type: "email", label: "Email", required: true },
          ],
          deliveryType: (draft.deliveryType as 'upload' | 'redirect') || 'upload',
          fileUrl: draft.fileUrl || "",
          fileName: draft.fileName || "",
          redirectUrl: draft.redirectUrl || "",
        });

        // Set image preview if exists
        if (draft.imageUrl) {
          setImagePreview(draft.imageUrl);
        }

        // Use stored currentStep instead of detecting from data
        const startStep = draft.currentStep || 1;
        setCurrentStep(startStep);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLeadMagnetData(prev => ({
      ...prev,
      fileUpload: file
    }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    
    try {
      let imageUrl = '';
      let fileUrl = '';
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Upload image if one is selected, otherwise preserve existing
      if (imageFile) {
        const validation = validateImageFile(imageFile);
        if (validation) {
          throw new Error(validation);
        }
        
        try {
          const uploadResult = await uploadFile(imageFile, 'products', 'lead-magnets', user.id);
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          throw new Error('Failed to upload image');
        }
      } else if (imagePreview && isEditing) {
        // Preserve existing image URL when editing
        imageUrl = imagePreview;
      }

      // Upload file if one is selected for upload delivery type
      let fileName = '';
      if (leadMagnetData.deliveryType === 'upload' && leadMagnetData.fileUpload) {
        try {
          const fileUploadResult = await uploadFile(leadMagnetData.fileUpload, 'products', 'lead-magnets', user.id);
          fileUrl = fileUploadResult.url;
          fileName = leadMagnetData.fileUpload.name; // Store original filename
        } catch (uploadError) {
          throw new Error('Failed to upload file');
        }
      } else if (leadMagnetData.fileUrl && isEditing) {
        // Preserve existing file URL and filename when editing
        fileUrl = leadMagnetData.fileUrl;
        fileName = leadMagnetData.fileName || '';
      }

      const formData = new FormData();
      formData.append('title', leadMagnetData.title || 'Untitled Lead Magnet');
      formData.append('subtitle', leadMagnetData.subtitle);
      formData.append('buttonText', leadMagnetData.buttonText);
      formData.append('deliveryType', leadMagnetData.deliveryType);
      formData.append('redirectUrl', leadMagnetData.redirectUrl || '');
      formData.append('formFields', JSON.stringify(leadMagnetData.fields));
      formData.append('productType', 'FREE_LEAD');
      formData.append('imageUrl', imageUrl);
      formData.append('fileUrl', fileUrl);
      formData.append('fileName', fileName);
      formData.append('currentStep', currentStep.toString());

      // Add product ID if editing
      if (isEditing && draftId) {
        formData.append('productId', draftId);
      }

      const result = isEditing && draftId 
        ? await updateDraftAction(formData)
        : await saveDraftAction(formData);
      
      if (result.success) {
        // Redirect back to My Store
        router.push('/dashboard/store');
      } else {
        console.error('Failed to save draft:', result.error);
        alert('Failed to save draft. Please try again.');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(error instanceof Error ? error.message : 'Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLeadMagnet = async () => {
    setFinalizing(true);
    
    try {
      let imageUrl = '';
      let fileUrl = '';
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Upload image if one is selected, otherwise preserve existing
      if (imageFile) {
        const validation = validateImageFile(imageFile);
        if (validation) {
          throw new Error(validation);
        }
        
        try {
          const uploadResult = await uploadFile(imageFile, 'products', 'lead-magnets', user.id);
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          throw new Error('Failed to upload image');
        }
      } else if (imagePreview) {
        imageUrl = imagePreview;
      }

      // Upload file if one is selected for upload delivery type
      let fileName = '';
      if (leadMagnetData.deliveryType === 'upload' && leadMagnetData.fileUpload) {
        try {
          const fileUploadResult = await uploadFile(leadMagnetData.fileUpload, 'products', 'lead-magnets', user.id);
          fileUrl = fileUploadResult.url;
          fileName = leadMagnetData.fileUpload.name; // Store original filename
        } catch (uploadError) {
          throw new Error('Failed to upload file');
        }
      } else if (leadMagnetData.fileUrl) {
        fileUrl = leadMagnetData.fileUrl;
        fileName = leadMagnetData.fileName || '';
      }

      const formData = new FormData();
      formData.append('title', leadMagnetData.title || 'Untitled Lead Magnet');
      formData.append('subtitle', leadMagnetData.subtitle);
      formData.append('buttonText', leadMagnetData.buttonText);
      formData.append('deliveryType', leadMagnetData.deliveryType);
      formData.append('redirectUrl', leadMagnetData.redirectUrl || '');
      formData.append('formFields', JSON.stringify(leadMagnetData.fields));
      formData.append('productType', 'FREE_LEAD');
      formData.append('imageUrl', imageUrl);

      let result;
      
      if (isEditing && draftId) {
        // Finalize existing draft
        formData.append('productId', draftId);
        formData.append('fileUrl', fileUrl);
        formData.append('fileName', fileName);
        result = await finalizeDraftAction(formData);
      } else {
        // Create new product directly (not as draft)
        const createFormData = new FormData();
        createFormData.append('title', leadMagnetData.title || 'Untitled Lead Magnet');
        createFormData.append('subtitle', leadMagnetData.subtitle);
        createFormData.append('buttonText', leadMagnetData.buttonText);
        createFormData.append('deliveryType', leadMagnetData.deliveryType);
        createFormData.append('redirectUrl', leadMagnetData.redirectUrl || '');
        createFormData.append('formFields', JSON.stringify(leadMagnetData.fields));
        createFormData.append('productType', 'FREE_LEAD');
        createFormData.append('imageUrl', imageUrl);
        createFormData.append('fileUrl', fileUrl);
        createFormData.append('fileName', fileName);
        createFormData.append('currentStep', '4'); // Final step

        // Save as draft first, then finalize it
        const draftResult = await saveDraftAction(createFormData);
        if (draftResult.success && draftResult.productId) {
          const finalizeFormData = new FormData();
          finalizeFormData.append('productId', draftResult.productId);
          finalizeFormData.append('title', leadMagnetData.title || 'Untitled Lead Magnet');
          finalizeFormData.append('subtitle', leadMagnetData.subtitle);
          finalizeFormData.append('buttonText', leadMagnetData.buttonText);
          finalizeFormData.append('deliveryType', leadMagnetData.deliveryType);
          finalizeFormData.append('redirectUrl', leadMagnetData.redirectUrl || '');
          finalizeFormData.append('formFields', JSON.stringify(leadMagnetData.fields));
          finalizeFormData.append('imageUrl', imageUrl);
          finalizeFormData.append('fileUrl', fileUrl);
          finalizeFormData.append('fileName', fileName);
          
          result = await finalizeDraftAction(finalizeFormData);
        } else {
          result = draftResult;
        }
      }
      
      if (result.success) {
        // Redirect back to My Store
        router.push('/dashboard/store');
      } else {
        console.error('Failed to create lead magnet:', result.error);
        alert('Failed to create lead magnet. Please try again.');
      }
    } catch (error) {
      console.error('Error creating lead magnet:', error);
      alert(error instanceof Error ? error.message : 'Failed to create lead magnet. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  const addField = (type: FormField["type"]) => {
    const getFieldDefaults = (fieldType: FormField["type"]) => {
      switch (fieldType) {
        case "phone":
          return { label: "Phone Number" };
        case "text":
          return { label: "Message" };
        default:
          return { label: type.charAt(0).toUpperCase() + type.slice(1) };
      }
    };

    const { label } = getFieldDefaults(type);

    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label,
      required: false,
    };

    setLeadMagnetData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const removeField = (fieldId: string) => {
    // Don't allow removing name and email fields
    if (fieldId === "1" || fieldId === "2") return;

    setLeadMagnetData((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setLeadMagnetData((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => {
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Step 1: Select Image
              </h2>
              <p className="text-gray-400 mb-6 text-sm">
                Choose an attractive image for your lead magnet.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Lead magnet preview"
                    className="mx-auto max-h-48 rounded-lg object-cover"
                  />
                  <Button
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Camera className="mx-auto w-12 h-12 text-gray-400" />
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      Upload Image
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG or GIF up to 5MB
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Step 2: Add Text
              </h2>
              <p className="text-gray-600 mb-6">
                Create compelling copy for your lead magnet.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={leadMagnetData.title}
                  onChange={(e) =>
                    setLeadMagnetData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. Free Marketing Guide"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <textarea
                  value={leadMagnetData.subtitle}
                  onChange={(e) =>
                    setLeadMagnetData((prev) => ({
                      ...prev,
                      subtitle: e.target.value,
                    }))
                  }
                  placeholder="e.g. Learn the top 10 strategies that helped me grow my business"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={leadMagnetData.buttonText}
                  onChange={(e) =>
                    setLeadMagnetData((prev) => ({
                      ...prev,
                      buttonText: e.target.value,
                    }))
                  }
                  placeholder="e.g. Get Free Download"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Step 3: Collect Info Fields
              </h2>
              <p className="text-gray-600 mb-6">
                Configure what information you want to collect from users.
              </p>
            </div>

            <div className="space-y-4">
              {leadMagnetData.fields.map((field) => {
                const isDefaultField = field.id === "1" || field.id === "2";
                return (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <span className="text-indigo-600 text-sm font-medium">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  <option value="">+ Add Field</option>
                  <option value="phone">Phone Number</option>
                  <option value="text">Text Field</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Step 4: Product Delivery
              </h2>
              <p className="text-gray-600 mb-6">
                Choose how users will receive your lead magnet after submitting their information.
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
                  onClick={() => setLeadMagnetData(prev => ({ ...prev, deliveryType: 'upload' }))}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    leadMagnetData.deliveryType === 'upload'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      leadMagnetData.deliveryType === 'upload' ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      <Upload className={`w-5 h-5 ${
                        leadMagnetData.deliveryType === 'upload' ? 'text-indigo-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Upload File</h3>
                      <p className="text-sm text-gray-500">Upload a PDF, document, or digital file</p>
                    </div>
                  </div>
                </div>

                {/* Redirect URL Option */}
                <div 
                  onClick={() => setLeadMagnetData(prev => ({ ...prev, deliveryType: 'redirect' }))}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    leadMagnetData.deliveryType === 'redirect'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      leadMagnetData.deliveryType === 'redirect' ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      <Link className={`w-5 h-5 ${
                        leadMagnetData.deliveryType === 'redirect' ? 'text-indigo-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Redirect to URL</h3>
                      <p className="text-sm text-gray-500">Redirect to a website or download link</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Content Based on Selection */}
            {leadMagnetData.deliveryType === 'upload' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Your File
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {leadMagnetData.fileUpload || leadMagnetData.fileUrl ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        <FileText className="w-8 h-8 text-indigo-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {leadMagnetData.fileUpload 
                              ? leadMagnetData.fileUpload.name 
                              : leadMagnetData.fileName || 'Uploaded file'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {leadMagnetData.fileUpload 
                              ? `${(leadMagnetData.fileUpload.size / 1024 / 1024).toFixed(2)} MB`
                              : leadMagnetData.fileUrl ? 'Saved to storage' : ''}
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
                    onChange={handleFileUpload}
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
                  value={leadMagnetData.redirectUrl || ''}
                  onChange={(e) => setLeadMagnetData(prev => ({ 
                    ...prev, 
                    redirectUrl: e.target.value 
                  }))}
                  placeholder="https://example.com/download-link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-gray-500">
                  Users will be redirected to this URL after submitting their information.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderMobilePreview = () => {
    return (
      <div className="mx-auto max-w-sm">
        <div className="bg-black rounded-[2.5rem] p-2">
          <div className="bg-white rounded-[2rem] h-[650px] overflow-hidden overflow-y-auto">
            <div className="p-6">
              {/* Lead Magnet Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
                <div className="flex space-x-3 mb-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Lead magnet"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Camera className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {leadMagnetData.title || "Your Lead Magnet Title"}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {leadMagnetData.subtitle ||
                        "Describe the value of your free resource here"}
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  {leadMagnetData.fields.map((field) => (
                    <div key={field.id}>
                      {/* Show label only for non-name and non-email fields */}
                      {field.type !== "name" && field.type !== "email" && (
                        <label className="block text-xs font-medium text-gray-700 mb-1">
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
                        disabled
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  ))}

                  <button
                    disabled
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                  >
                    {leadMagnetData.buttonText}
                  </button>
                </div>
              </div>

              {/* Placeholder for other content */}
              <div className="space-y-3">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 text-center">
                    Your other links will appear here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left side - Form */}
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? "bg-indigo-600 text-white"
                    : step < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step < currentStep ? "✓" : step}
              </div>
              {step < 4 && (
                <div
                  className={`w-12 h-0.5 ${
                    step < currentStep ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </Button>
          </div>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleCreateLeadMagnet}
              disabled={finalizing}
            >
              {finalizing ? 'Creating...' : 'Create Lead Magnet'}
            </Button>
          )}
        </div>
      </div>

      {/* Right side - Mobile Preview */}
      <div className="lg:sticky lg:top-6">{renderMobilePreview()}</div>
    </div>
  );
}
