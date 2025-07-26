"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, Upload, Save, Bold, Italic, List, Link as LinkIcon, X, Plus, ArrowLeft, Calendar, Clock, Users, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadFile, validateImageFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { saveDraftAction, updateDraftAction, loadDraftAction, finalizeDraftAction } from "@/app/dashboard/store/draft-actions";

interface FormField {
  id: string;
  type: "name" | "email" | "phone" | "text";
  label: string;
  required: boolean;
}

interface WebinarData {
  style: 'button' | 'callout' | '';
  image?: string;
  title: string;
  subtitle?: string; // Only for callout style
  buttonText?: string; // Only for callout style
  price: string;
  // Registration page data
  registrationImage?: string;
  description: string; // Rich text description
  ctaButtonText: string;
  collectFields: FormField[];
  // Webinar details
  webinarDate: string;
  webinarTime: string;
  duration: string;
  timeZone: string;
  maxAttendees: string;
  meetingPlatform: string;
}

interface WebinarCreatorProps {
  draftId?: string;
}

export function WebinarCreator({ draftId }: WebinarCreatorProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [registrationImageFile, setRegistrationImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [registrationImagePreview, setRegistrationImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [googleEventData, setGoogleEventData] = useState<{
    eventId?: string;
    meetLink?: string;
    calendarLink?: string;
  } | null>(null);
  const router = useRouter();
  
  const [webinarData, setWebinarData] = useState<WebinarData>({
    style: '',
    title: "",
    subtitle: "",
    buttonText: "Register Now",
    price: "",
    // Registration page defaults
    description: "",
    ctaButtonText: "Register Now",
    collectFields: [
      { id: "1", type: "name", label: "Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
    ],
    // Webinar details defaults
    webinarDate: '',
    webinarTime: '',
    duration: '60',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    maxAttendees: '100',
    meetingPlatform: 'zoom',
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const registrationImageInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Check Google connection status and URL parameters
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/google/status');
        const data = await response.json();
        setGoogleConnected(data.isConnected);
      } catch (error) {
        console.error('Error checking Google connection:', error);
      }
    };

    // Check URL parameters for Google auth results
    const urlParams = new URLSearchParams(window.location.search);
    const googleConnected = urlParams.get('google_connected');
    const googleError = urlParams.get('google_error');

    if (googleConnected === 'true') {
      setGoogleConnected(true);
      alert('Google Calendar connected successfully!');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (googleError) {
      alert(`Google Calendar connection failed: ${googleError}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (userId) {
      checkGoogleConnection();
    }
  }, [userId]);

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
        
        // Parse webinar data from formFields
        let webinarFormData: Record<string, unknown> = {};
        try {
          if (draft.formFields) {
            // formFields is already parsed by Prisma, no need to JSON.parse again
            webinarFormData = typeof draft.formFields === 'string' 
              ? JSON.parse(draft.formFields) 
              : draft.formFields;
          }
        } catch (error) {
          console.error('Error parsing draft formFields:', error);
        }
        
        // Load draft data
        setWebinarData({
          style: (webinarFormData?.style as "button" | "callout") || 'button',
          title: draft.title || "",
          subtitle: draft.subtitle || "",
          buttonText: draft.buttonText || "Register Now",
          price: draft.price || "0",
          description: (webinarFormData?.description as string) || "",
          ctaButtonText: (webinarFormData?.ctaButtonText as string) || "Register Now",
          collectFields: (Array.isArray(webinarFormData?.collectFields) ? webinarFormData.collectFields : [
            { id: "1", type: "name", label: "Name", required: true },
            { id: "2", type: "email", label: "Email", required: true },
          ]),
          webinarDate: (webinarFormData?.webinarDate as string) || "",
          webinarTime: (webinarFormData?.webinarTime as string) || "",
          duration: (webinarFormData?.duration as string) || "60",
          timeZone: (webinarFormData?.timeZone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone,
          maxAttendees: (webinarFormData?.maxAttendees as string) || "100",
          meetingPlatform: (webinarFormData?.meetingPlatform as string) || "zoom",
        });

        // Set image previews if they exist
        if (draft.imageUrl) {
          setImagePreview(draft.imageUrl);
        }
        
        // Set registration image preview if it exists
        if (webinarFormData.registrationImageUrl && typeof webinarFormData.registrationImageUrl === 'string') {
          setRegistrationImagePreview(webinarFormData.registrationImageUrl);
        } else if (draft.imageUrl) {
          // Fallback to main image if no separate registration image
          setRegistrationImagePreview(draft.imageUrl);
        }

        // Set current step from draft
        setCurrentStep(draft.currentStep || 1);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRegistrationImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setRegistrationImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setRegistrationImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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

  const canProceedFromStep1 = webinarData.style !== '' && webinarData.title.trim() !== '' && webinarData.price.trim() !== '';
  const canProceedFromStep2 = webinarData.description.trim() !== '' && webinarData.ctaButtonText.trim() !== '';
  const canCreateWebinar = webinarData.webinarDate.trim() && webinarData.webinarTime.trim();

  // Google Calendar functions
  const handleGoogleConnect = () => {
    setIsConnectingGoogle(true);
    // Build return URL to come back to this webinar creation page
    const currentUrl = window.location.pathname + window.location.search;
    const returnUrl = encodeURIComponent(currentUrl);
    window.location.href = `/api/google/auth?returnUrl=${returnUrl}`;
  };

  const handleGoogleDisconnect = async () => {
    try {
      const response = await fetch('/api/google/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setGoogleConnected(false);
        setGoogleEventData(null);
        alert('Google Calendar disconnected successfully!');
      } else {
        alert('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      alert('Failed to disconnect Google Calendar');
    }
  };

  const handleCreateCalendarEvent = async () => {
    if (!googleConnected) {
      alert('Please connect your Google Calendar first');
      return;
    }

    if (!webinarData.title || !webinarData.webinarDate || !webinarData.webinarTime) {
      alert('Please fill in the webinar title, date, and time first');
      return;
    }

    setCreatingEvent(true);

    try {
      const response = await fetch('/api/webinar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarData: {
            title: webinarData.title,
            description: webinarData.description || 'Join our webinar!',
            webinarDate: webinarData.webinarDate,
            webinarTime: webinarData.webinarTime,
            duration: webinarData.duration,
            timeZone: webinarData.timeZone,
          },
          attendeeEmails: [], // Will be populated from registrations later
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGoogleEventData({
          eventId: result.event.id,
          meetLink: result.event.meetLink,
          calendarLink: result.event.htmlLink,
        });
        
        alert('Calendar event created successfully! Google Meet link generated.');
      } else {
        if (result.needsAuth) {
          setGoogleConnected(false);
          alert('Google authentication expired. Please reconnect your Google account.');
        } else {
          alert(`Failed to create calendar event: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      alert('Error creating calendar event');
    } finally {
      setCreatingEvent(false);
    }
  };
  
  // Field management functions for step 2
  const addField = (type: FormField["type"]) => {
    const getFieldDefaults = (fieldType: FormField["type"]) => {
      switch (fieldType) {
        case "phone":
          return { label: "Phone Number" };
        case "text":
          return { label: "Message" };
        default:
          return { label: fieldType.charAt(0).toUpperCase() + fieldType.slice(1) };
      }
    };

    const { label } = getFieldDefaults(type);

    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label,
      required: false,
    };

    setWebinarData(prev => ({
      ...prev,
      collectFields: [...prev.collectFields, newField]
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setWebinarData(prev => ({
      ...prev,
      collectFields: prev.collectFields.map(field => {
        if (field.id === fieldId) {
          // Don't allow changing the type or core properties of name and email fields
          if (fieldId === "1" || fieldId === "2") {
            return { ...field, label: updates.label || field.label };
          }
          return { ...field, ...updates };
        }
        return field;
      })
    }));
  };

  const removeField = (fieldId: string) => {
    // Don't allow removing name and email fields
    if (fieldId === "1" || fieldId === "2") return;

    setWebinarData(prev => ({
      ...prev,
      collectFields: prev.collectFields.filter(field => field.id !== fieldId)
    }));
  };

  // Save draft functionality
  const handleSaveDraft = async () => {
    setSaving(true);
    
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      
      // Basic product info
      formData.append('title', webinarData.title);
      formData.append('subtitle', webinarData.subtitle || ''); // Store callout subtitle
      formData.append('buttonText', webinarData.buttonText || webinarData.ctaButtonText);
      formData.append('productType', 'WEBINAR');
      formData.append('currentStep', currentStep.toString());
      formData.append('price', webinarData.price);
      
      // Store webinar specific data in formFields
      const webinarFormData = {
        style: webinarData.style,
        description: webinarData.description,
        ctaButtonText: webinarData.ctaButtonText,
        collectFields: webinarData.collectFields,
        registrationImageUrl: registrationImagePreview,
        webinarDate: webinarData.webinarDate,
        webinarTime: webinarData.webinarTime,
        duration: webinarData.duration,
        timeZone: webinarData.timeZone,
        maxAttendees: webinarData.maxAttendees,
        meetingPlatform: webinarData.meetingPlatform,
      };
      formData.append('formFields', JSON.stringify(webinarFormData));
      
      // File uploads
      if (imageFile) {
        const imageResult = await uploadFile(imageFile, 'products', 'images', userId);
        formData.append('imageUrl', imageResult.url);
      } else if (imagePreview) {
        formData.append('imageUrl', imagePreview);
      }
      
      // Handle registration image upload separately
      if (registrationImageFile) {
        const registrationImageResult = await uploadFile(registrationImageFile, 'products', 'images', userId);
        // Update the webinarFormData with the new registration image URL
        const updatedWebinarData = {
          style: webinarData.style,
          description: webinarData.description,
          ctaButtonText: webinarData.ctaButtonText,
          collectFields: webinarData.collectFields,
          registrationImageUrl: registrationImageResult.url,
          webinarDate: webinarData.webinarDate,
          webinarTime: webinarData.webinarTime,
        };
        formData.set('formFields', JSON.stringify(updatedWebinarData));
      }

      let result;
      if (isEditing && currentDraftId) {
        formData.append('productId', currentDraftId);
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
        router.push('/dashboard/store');
      } else {
        console.error('Failed to save draft:', result.error);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  // Create webinar functionality
  const handleCreateWebinar = async () => {
    setFinalizing(true);
    
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      
      // Basic product info
      formData.append('title', webinarData.title);
      formData.append('subtitle', webinarData.subtitle || ''); // Store callout subtitle
      formData.append('buttonText', webinarData.buttonText || webinarData.ctaButtonText);
      formData.append('productType', 'WEBINAR');
      formData.append('price', webinarData.price);
      
      // Store webinar specific data in formFields
      const webinarFormData = {
        style: webinarData.style,
        description: webinarData.description,
        ctaButtonText: webinarData.ctaButtonText,
        collectFields: webinarData.collectFields,
        registrationImageUrl: registrationImagePreview,
        webinarDate: webinarData.webinarDate,
        webinarTime: webinarData.webinarTime,
        duration: webinarData.duration,
        timeZone: webinarData.timeZone,
        maxAttendees: webinarData.maxAttendees,
        meetingPlatform: webinarData.meetingPlatform,
      };
      formData.append('formFields', JSON.stringify(webinarFormData));
      
      // File uploads
      let imageUrl = imagePreview;
      if (imageFile) {
        const imageResult = await uploadFile(imageFile, 'products', 'images', userId);
        imageUrl = imageResult.url;
      }
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }
      
      // Handle registration image upload separately
      if (registrationImageFile) {
        const registrationImageResult = await uploadFile(registrationImageFile, 'products', 'images', userId);
        // Update the webinarFormData with the new registration image URL
        const updatedWebinarData = {
          style: webinarData.style,
          description: webinarData.description,
          ctaButtonText: webinarData.ctaButtonText,
          collectFields: webinarData.collectFields,
          registrationImageUrl: registrationImageResult.url,
          webinarDate: webinarData.webinarDate,
          webinarTime: webinarData.webinarTime,
        };
        formData.set('formFields', JSON.stringify(updatedWebinarData));
      }

      let result;
      if (isEditing && currentDraftId) {
        // Finalize existing draft
        formData.append('productId', currentDraftId);
        result = await finalizeDraftAction(formData);
      } else {
        // Create new webinar directly (not as draft)
        const createFormData = new FormData();
        createFormData.append('title', webinarData.title);
        createFormData.append('subtitle', webinarData.subtitle || '');
        createFormData.append('buttonText', webinarData.buttonText || webinarData.ctaButtonText);
        createFormData.append('formFields', JSON.stringify(webinarFormData));
        createFormData.append('productType', 'WEBINAR');
        createFormData.append('price', webinarData.price);
        createFormData.append('imageUrl', imageUrl || '');
        createFormData.append('currentStep', '3'); // Final step

        // Save as draft first, then finalize it
        const draftResult = await saveDraftAction(createFormData);
        if (draftResult.success && draftResult.productId) {
          const finalizeFormData = new FormData();
          finalizeFormData.append('productId', draftResult.productId);
          finalizeFormData.append('title', webinarData.title);
          finalizeFormData.append('subtitle', webinarData.subtitle || '');
          finalizeFormData.append('buttonText', webinarData.buttonText || webinarData.ctaButtonText);
          finalizeFormData.append('formFields', JSON.stringify(webinarFormData));
          finalizeFormData.append('imageUrl', imageUrl || '');
          
          result = await finalizeDraftAction(finalizeFormData);
        } else {
          result = draftResult;
        }
      }

      if (result.success) {
        // Redirect back to My Store
        router.push('/dashboard/store');
      } else {
        console.error('Failed to create webinar:', result.error);
        alert('Failed to create webinar. Please try again.');
      }
    } catch (error) {
      console.error('Error creating webinar:', error);
      alert(error instanceof Error ? error.message : 'Failed to create webinar. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  // Step 1: Combined Style Selection and Product Details with Live Preview
  const renderWebinarSetup = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT SIDE - Form */}
      <div className="space-y-6">
        {/* Style Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Webinar Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Button Style */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                webinarData.style === 'button' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setWebinarData(prev => ({ ...prev, style: 'button' }))}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">🔘</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Button Style</h4>
                <p className="text-xs text-gray-600">Simple button layout</p>
              </div>
            </div>

            {/* Callout Style */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                webinarData.style === 'callout' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setWebinarData(prev => ({ ...prev, style: 'callout' }))}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">📋</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Callout Style</h4>
                <p className="text-xs text-gray-600">Card with details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Webinar Details - Only show if style is selected */}
        {webinarData.style && (
          <>
            {/* Webinar Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webinar Image *
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {imageFile ? 'Change' : 'Upload'}
                  </Button>
                  {imageFile && (
                    <p className="text-xs text-green-600 mt-1">
                      {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Webinar Title *
              </label>
              <input
                type="text"
                id="title"
                value={webinarData.title}
                onChange={(e) => setWebinarData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter webinar title"
              />
            </div>

            {/* Subtitle - Only for callout style */}
            {webinarData.style === 'callout' && (
              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  id="subtitle"
                  value={webinarData.subtitle}
                  onChange={(e) => setWebinarData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Brief description of your webinar"
                />
              </div>
            )}

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="price"
                  value={webinarData.price}
                  onChange={(e) => setWebinarData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Button Text - Only for callout style */}
            {webinarData.style === 'callout' && (
              <div>
                <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  id="buttonText"
                  value={webinarData.buttonText}
                  onChange={(e) => setWebinarData(prev => ({ ...prev, buttonText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Register Now"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT SIDE - Live Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Live Preview</h4>
          
          {!webinarData.style ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">📱</span>
              <p className="text-sm">Select a style to see preview</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {webinarData.style === 'button' ? (
                // Button Style Preview
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm text-gray-900">
                      {webinarData.title || 'Webinar Title'}
                    </div>
                    <div className="text-purple-600 font-semibold text-sm">
                      ${webinarData.price || '0.00'}
                    </div>
                  </div>
                </div>
              ) : (
                // Callout Style Preview
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm text-gray-900">
                        {webinarData.title || 'Webinar Title'}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {webinarData.subtitle || 'Webinar subtitle description'}
                      </div>
                      <div className="text-purple-600 font-semibold text-sm">
                        ${webinarData.price || '0.00'}
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-purple-600 text-white text-xs py-2 rounded">
                    {webinarData.buttonText || 'Register Now'}
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
    return text
      .split('\n')
      .map((line, index) => {
        // Handle bullet points
        if (line.trim().startsWith('•')) {
          return (
            <div key={index} className="flex items-start space-x-2 mb-1">
              <span className="text-purple-600 mt-1">•</span>
              <span className="flex-1 text-sm text-gray-700">{line.replace('•', '').trim()}</span>
            </div>
          );
        }
        
        // Handle bold and italic (simple version)
        const formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-purple-600 underline">$1</a>');
        
        return (
          <p key={index} className="text-sm text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      });
  };

  // Step 2: Registration Page with Mobile Preview
  const renderRegistrationPage = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT SIDE - Form */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Page</h3>
          <p className="text-gray-600 mb-6">Design the page visitors will see when registering for your webinar.</p>
        </div>

        {/* Registration Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webinar Image for Registration
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              {registrationImagePreview ? (
                <img src={registrationImagePreview} alt="Registration Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                ref={registrationImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleRegistrationImageUpload}
              />
              <Button 
                type="button" 
                variant="outline" 
                className="mb-2"
                onClick={() => registrationImageInputRef.current?.click()}
              >
                {registrationImageFile ? 'Change Image' : 'Upload Image'}
              </Button>
              {registrationImageFile && (
                <p className="text-xs text-green-600 mb-1">
                  Selected: {registrationImageFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                JPG, PNG or GIF. Max size 5MB. Recommended: 600x400px
              </p>
            </div>
          </div>
        </div>

      {/* Webinar Description - Rich Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webinar Description *
        </label>
        <div className="border border-gray-300 rounded-md">
          {/* Simple Rich Text Toolbar */}
          <div className="border-b border-gray-200 p-2 flex space-x-2">
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded"
              onClick={() => {
                // Simple bold toggle - for MVP we'll use basic formatting
                const textarea = document.getElementById('description') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const selectedText = textarea.value.substring(start, end);
                  const newText = `**${selectedText}**`;
                  const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
                  setWebinarData(prev => ({ ...prev, description: newValue }));
                }
              }}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded"
              onClick={() => {
                const textarea = document.getElementById('description') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const selectedText = textarea.value.substring(start, end);
                  const newText = `*${selectedText}*`;
                  const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
                  setWebinarData(prev => ({ ...prev, description: newValue }));
                }
              }}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded"
              onClick={() => {
                const textarea = document.getElementById('description') as HTMLTextAreaElement;
                if (textarea) {
                  const cursorPos = textarea.selectionStart;
                  const newText = '• ';
                  const newValue = textarea.value.substring(0, cursorPos) + newText + textarea.value.substring(cursorPos);
                  setWebinarData(prev => ({ ...prev, description: newValue }));
                }
              }}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded"
              onClick={() => {
                const textarea = document.getElementById('description') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const selectedText = textarea.value.substring(start, end) || 'link text';
                  const newText = `[${selectedText}](https://example.com)`;
                  const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
                  setWebinarData(prev => ({ ...prev, description: newValue }));
                }
              }}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
          <textarea
            id="description"
            value={webinarData.description}
            onChange={(e) => setWebinarData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 min-h-[120px] border-0 focus:outline-none focus:ring-0 resize-none"
            placeholder="Describe your webinar in detail. Use **bold**, *italic*, • bullet points, and [links](url) for formatting."
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Use **bold**, *italic*, • for bullets, [text](url) for links
        </p>
      </div>

      {/* CTA Button Text */}
      <div>
        <label htmlFor="ctaButtonText" className="block text-sm font-medium text-gray-700 mb-2">
          Call-to-Action Button Text *
        </label>
        <input
          type="text"
          id="ctaButtonText"
          value={webinarData.ctaButtonText}
          onChange={(e) => setWebinarData(prev => ({ ...prev, ctaButtonText: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Register Now"
        />
      </div>

      {/* Collect Attendee Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Collect Attendee Information
        </label>
        <div className="space-y-4">
          {webinarData.collectFields.map((field) => {
            const isDefaultField = field.id === "1" || field.id === "2";
            return (
              <div
                key={field.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-medium">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none"
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

      {/* RIGHT SIDE - Mobile Registration Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Registration Page Preview</h4>
          
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

                  {/* Webinar Image */}
                  <div className="mb-6">
                    {registrationImagePreview ? (
                      <img
                        src={registrationImagePreview}
                        alt="Webinar"
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
                    {webinarData.title || 'Webinar Title'}
                  </h1>

                  {/* Price */}
                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    ${webinarData.price || '0.00'}
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    {webinarData.description ? (
                      <div className="space-y-2">
                        {renderFormattedText(webinarData.description)}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        Webinar description will appear here...
                      </p>
                    )}
                  </div>

                  {/* Attendee Info Collection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h3>
                    <div className="space-y-3">
                      {webinarData.collectFields.map((field) => (
                        <div key={field.id}>
                          {field.type !== "name" && field.type !== "email" && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
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
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    {webinarData.ctaButtonText || 'Register Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Generate time slots every 15 minutes
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  // Get common time zones
  const getTimeZones = () => [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  // Meeting platform options with icons
  const getMeetingPlatforms = () => [
    { 
      value: 'zoom', 
      label: 'Zoom', 
      icon: '🎥'
    },
    { 
      value: 'google-meet', 
      label: 'Google Meet', 
      icon: '📹'
    },
    { 
      value: 'teams', 
      label: 'Microsoft Teams', 
      icon: '💼'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: '🔗'
    }
  ];

  // Calendar dropdown component
  const CalendarDropdown = ({ selectedDate, onDateSelect }: { selectedDate: string; onDateSelect: (date: string) => void }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = new Date();
    const selected = selectedDate ? new Date(selectedDate) : null;

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
        return newMonth;
      });
    };

    const handleDateSelect = (date: Date) => {
      onDateSelect(date.toISOString().split('T')[0]);
      setShowCalendar(false);
    };

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-50 w-80">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
          >
            ←
          </button>
          <h3 className="font-semibold text-gray-900 text-sm">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
          >
            →
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selected && date.toDateString() === selected.toDateString();
            const isPast = date < today && !isToday;

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (!isPast && isCurrentMonth) {
                    handleDateSelect(date);
                  }
                }}
                disabled={isPast || !isCurrentMonth}
                className={`
                  p-1.5 text-xs rounded hover:bg-gray-100 transition-colors
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                  ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                  ${isSelected ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
                  ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  ${!isCurrentMonth ? 'cursor-not-allowed' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Step 3: Webinar Availability - with mobile preview
  const renderWebinarDetails = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT SIDE - Form */}
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Webinar Availability</h3>
          <p className="text-gray-600 mb-6">Choose when your webinar will take place and configure settings.</p>
        </div>

        {/* Date and Time Selection */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Selection */}
            <div className="relative" ref={calendarRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date *
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-left bg-white flex items-center justify-between"
              >
                <span className={webinarData.webinarDate ? 'text-gray-900' : 'text-gray-500'}>
                  {webinarData.webinarDate 
                    ? new Date(webinarData.webinarDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Select date'
                  }
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
              </button>
              
              {showCalendar && (
                <CalendarDropdown 
                  selectedDate={webinarData.webinarDate}
                  onDateSelect={(date) => setWebinarData(prev => ({ ...prev, webinarDate: date }))}
                />
              )}
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Start Time *
              </label>
              <div className="relative">
                <select
                  value={webinarData.webinarTime}
                  onChange={(e) => setWebinarData(prev => ({ ...prev, webinarTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none"
                >
                  <option value="">Select time</option>
                  {generateTimeSlots().map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Webinar Settings */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            <Settings className="w-5 h-5 inline mr-2" />
            Configure Webinar Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={webinarData.duration}
                onChange={(e) => setWebinarData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
              </select>
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone
              </label>
              <select
                value={webinarData.timeZone}
                onChange={(e) => setWebinarData(prev => ({ ...prev, timeZone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {getTimeZones().map(tz => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Max Attendees
              </label>
              <select
                value={webinarData.maxAttendees}
                onChange={(e) => setWebinarData(prev => ({ ...prev, maxAttendees: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="25">25 attendees</option>
                <option value="50">50 attendees</option>
                <option value="100">100 attendees</option>
                <option value="250">250 attendees</option>
                <option value="500">500 attendees</option>
                <option value="1000">1000 attendees</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>

            {/* Meeting Platform */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Online Meeting Platform
              </label>
              
              {webinarData.meetingPlatform === 'google-meet' ? (
                <div className="space-y-4">
                  {/* Google Meet Integration */}
                  <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">📹</span>
                        <span className="font-medium text-gray-900">Google Meet</span>
                      </div>
                      {googleConnected ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600">✓ Connected</span>
                          <Button 
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGoogleDisconnect}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          type="button"
                          size="sm"
                          onClick={handleGoogleConnect}
                          disabled={isConnectingGoogle}
                        >
                          {isConnectingGoogle ? 'Connecting...' : 'Connect Calendar'}
                        </Button>
                      )}
                    </div>
                    
                    {googleConnected && (
                      <div className="space-y-3">
                        {/* Create Event Button */}
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={handleCreateCalendarEvent}
                          disabled={creatingEvent || !webinarData.title || !webinarData.webinarDate || !webinarData.webinarTime}
                          className="w-full"
                        >
                          {creatingEvent ? 'Creating Event...' : 'Create Calendar Event & Meet Link'}
                        </Button>
                        
                        {/* Event Details */}
                        {googleEventData && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="text-sm">
                              <p className="font-medium text-green-800 mb-2">✓ Calendar Event Created</p>
                              {googleEventData.meetLink && (
                                <p className="text-green-700 mb-1">
                                  <strong>Meet Link:</strong>{' '}
                                  <a 
                                    href={googleEventData.meetLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {googleEventData.meetLink}
                                  </a>
                                </p>
                              )}
                              {googleEventData.calendarLink && (
                                <p className="text-green-700">
                                  <strong>Calendar:</strong>{' '}
                                  <a 
                                    href={googleEventData.calendarLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View in Google Calendar
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Option to switch to other platforms */}
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setWebinarData(prev => ({ ...prev, meetingPlatform: 'zoom' }))}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Use different platform instead
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={webinarData.meetingPlatform}
                      onChange={(e) => setWebinarData(prev => ({ ...prev, meetingPlatform: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none"
                    >
                      {getMeetingPlatforms().map(platform => (
                        <option key={platform.value} value={platform.value}>
                          {platform.icon} {platform.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {webinarData.meetingPlatform !== 'google-meet' && (
                    <p className="text-xs text-gray-500">
                      Meeting link configuration will be set up later
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Mobile Registration Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Registration Page Preview</h4>
          
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

                  {/* Webinar Image */}
                  <div className="mb-6">
                    {registrationImagePreview ? (
                      <img
                        src={registrationImagePreview}
                        alt="Webinar"
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
                    {webinarData.title || 'Webinar Title'}
                  </h1>

                  {/* Price */}
                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    ${webinarData.price || '0.00'}
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    {webinarData.description ? (
                      <div className="space-y-2">
                        {renderFormattedText(webinarData.description)}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        Webinar description will appear here...
                      </p>
                    )}
                  </div>

                  {/* Webinar Details */}
                  {(webinarData.webinarDate || webinarData.webinarTime) && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Webinar Schedule
                      </h3>
                      
                      {webinarData.webinarDate && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(webinarData.webinarDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      
                      {webinarData.webinarTime && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Clock className="w-4 h-4 mr-2" />
                          {new Date(`2000-01-01T${webinarData.webinarTime}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })} ({webinarData.timeZone.split('/')[1]?.replace('_', ' ')})
                        </div>
                      )}
                      
                      {webinarData.duration && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          Duration: {webinarData.duration} minutes
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attendee Info Collection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h3>
                    <div className="space-y-3">
                      {webinarData.collectFields.map((field) => (
                        <div key={field.id}>
                          {field.type !== "name" && field.type !== "email" && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
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
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    {webinarData.ctaButtonText || 'Register Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps - Connected */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {step === 1 && "Webinar Setup"}
                  {step === 2 && "Registration Page"}
                  {step === 3 && "Availability"}
                </span>
              </div>
              {index < 2 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-0.5 w-full ${
                      currentStep > step ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        {currentStep === 1 && renderWebinarSetup()}
        {currentStep === 2 && renderRegistrationPage()}
        {currentStep === 3 && renderWebinarDetails()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        
        <div className="flex space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !canProceedFromStep1) ||
                (currentStep === 2 && !canProceedFromStep2)
              }
            >
              Next
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={handleCreateWebinar}
              disabled={!canCreateWebinar || finalizing}
            >
              {finalizing ? 'Creating...' : 'Create Webinar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}