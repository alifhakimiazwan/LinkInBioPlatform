"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toast, useToast } from "@/components/ui/toast";
import {
  updateProfileAction,
  updateSocialLinksAction,
} from "@/app/dashboard/store/actions";
import { uploadFile, validateImageFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import {
  Instagram,
  Twitter,
  Music,
  Youtube,
  Camera,
  Linkedin,
  Github,
  Facebook,
  Twitch,
  Plus,
  X,
  Upload,
} from "lucide-react";

interface ProfileEditorProps {
  user: {
    dbUser: {
      fullName?: string | null;
      username: string;
      bio?: string | null;
      avatar?: string | null;
    };
  };
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
}

export function ProfileEditor({ user, socialLinks }: ProfileEditorProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMessage, setSocialMessage] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.dbUser.avatar || null
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available social platforms
  const allPlatforms = [
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      bg: "bg-gradient-to-tr from-purple-400 to-pink-400",
    },
    { id: "twitter", name: "Twitter/X", icon: Twitter, bg: "bg-blue-400" },
    { id: "tiktok", name: "TikTok", icon: Music, bg: "bg-black" },
    { id: "youtube", name: "YouTube", icon: Youtube, bg: "bg-red-500" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, bg: "bg-blue-600" },
    { id: "github", name: "GitHub", icon: Github, bg: "bg-gray-800" },
    { id: "facebook", name: "Facebook", icon: Facebook, bg: "bg-blue-600" },
    { id: "twitch", name: "Twitch", icon: Twitch, bg: "bg-purple-600" },
  ];

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        setUserId(authUser.id);
      }
    };
    getUser();
  }, []);

  // Initialize active platforms based on existing social links
  useEffect(() => {
    const platformsWithLinks = socialLinks.map((link) => link.platform);
    // Always show the main 4 platforms + any additional ones with existing links
    const defaultPlatforms = ["instagram", "twitter", "tiktok", "youtube"];
    const additionalActivePlatforms = platformsWithLinks.filter(
      (p) => !defaultPlatforms.includes(p)
    );
    setActivePlatforms([...defaultPlatforms, ...additionalActivePlatforms]);
  }, [socialLinks]);

  const addPlatform = (platformId: string) => {
    if (!activePlatforms.includes(platformId)) {
      setActivePlatforms([...activePlatforms, platformId]);
    }
    setShowDropdown(false);
  };

  const removePlatform = (platformId: string) => {
    // Don't allow removing the main 4 platforms
    const mainPlatforms = ["instagram", "twitter", "tiktok", "youtube"];
    if (!mainPlatforms.includes(platformId)) {
      setActivePlatforms(activePlatforms.filter((p) => p !== platformId));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setMessage("");
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMessage("");

    try {
      // Upload avatar if a new one was selected
      if (avatarFile && userId) {
        setUploadingAvatar(true);
        try {
          const avatarResult = await uploadFile(
            avatarFile,
            "products",
            "avatars",
            userId
          );
          formData.append("avatar", avatarResult.url);
          formData.append("avatarPath", avatarResult.path);
        } catch (error) {
          throw new Error("Failed to upload avatar");
        } finally {
          setUploadingAvatar(false);
        }
      }

      await updateProfileAction(formData);
      showToast("Profile updated successfully!");
      setMessage("");
      setAvatarFile(null); // Clear the file after successful upload
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Error updating profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinksSubmit = async (formData: FormData) => {
    setSocialLoading(true);
    setSocialMessage("");

    try {
      await updateSocialLinksAction(formData);
      showToast("Social links updated successfully!");
      setSocialMessage("");
    } catch (error) {
      setSocialMessage("Error updating social links");
    } finally {
      setSocialLoading(false);
    }
  };

  // Get existing social link URLs
  const getSocialUrl = (platform: string) => {
    const link = socialLinks.find((link) => link.platform === platform);
    return link?.url || "";
  };

  return (
    <>
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <div className="space-y-6">
        {/* Combined Profile Information Section */}
        <div className="bg-white p-6 rounded-2xl shadow-none">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Profile Information
          </h2>

          <form action={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div>
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-500" />
                  )}
                </div>

                {/* Upload Icon Button */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 cursor-pointer rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <Upload className="w-4 h-4 text-white" />
                </button>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {avatarFile && (
                <p className="text-xs text-green-600 mt-2">
                  Selected: {avatarFile.name}
                </p>
              )}
              {uploadingAvatar && (
                <p className="text-xs text-blue-600 mt-2">Uploading...</p>
              )}
            </div>
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Display Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                defaultValue={user.dbUser.fullName || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  pintas.store/
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  defaultValue={user.dbUser.username}
                  className="flex-1 px-3 py-2 border text-sm border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your-username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={user.dbUser.bio || ""}
                className="w-full px-3 py-2 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tell your audience about yourself..."
              />
            </div>

            {message && (
              <div
                className={`text-sm ${
                  message.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex justify-end ">
              <Button
                type="submit"
                className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white text-sm shadow-none"
                disabled={loading || uploadingAvatar}
              >
                {loading
                  ? "Saving..."
                  : uploadingAvatar
                  ? "Uploading Avatar..."
                  : "Save"}
              </Button>
            </div>
          </form>
        </div>

        {/* Social Links Section */}
        <div className="bg-white p-6 rounded-2xl shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg  text-gray-900 font-medium">Social Links</h2>
            <div className="relative" ref={dropdownRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 cursor-pointer shadow-none border border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Add Platform</span>
              </Button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {allPlatforms
                      .filter(
                        (platform) => !activePlatforms.includes(platform.id)
                      )
                      .map((platform) => {
                        const IconComponent = platform.icon;
                        return (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => addPlatform(platform.id)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                          >
                            <div
                              className={`w-6 h-6 ${platform.bg} rounded flex items-center justify-center`}
                            >
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">
                              {platform.name}
                            </span>
                          </button>
                        );
                      })}
                    {allPlatforms.filter(
                      (platform) => !activePlatforms.includes(platform.id)
                    ).length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        All platforms added
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <form action={handleSocialLinksSubmit} className="space-y-4">
            {activePlatforms.map((platformId) => {
              const platform = allPlatforms.find((p) => p.id === platformId);
              if (!platform) return null;

              const IconComponent = platform.icon;
              const isMainPlatform = [
                "instagram",
                "twitter",
                "tiktok",
                "youtube",
              ].includes(platformId);

              return (
                <div key={platformId} className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 ${platform.bg} rounded-lg flex items-center justify-center`}
                  >
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      name={platformId}
                      defaultValue={getSocialUrl(platformId)}
                      placeholder={`${platform.name} URL`}
                      className="w-full px-3 py-2 border text-sm text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  {!isMainPlatform && (
                    <button
                      type="button"
                      onClick={() => removePlatform(platformId)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {socialMessage && (
              <div
                className={`text-sm ${
                  socialMessage.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {socialMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                variant="outline"
                className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white text-sm shadow-none"
                disabled={socialLoading}
              >
                {socialLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
