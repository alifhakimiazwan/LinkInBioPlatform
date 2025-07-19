import { Instagram, Twitter, Music, Youtube, Link, Linkedin, Github, Facebook, Twitch, Camera } from "lucide-react";

interface FormField {
  id: string;
  type: "name" | "email" | "phone" | "text";
  label: string;
  required: boolean;
}

interface Product {
  id: string;
  title: string;
  subtitle?: string | null;
  buttonText?: string | null;
  imageUrl?: string | null;
  type: string;
  isDraft?: boolean;
  isActive: boolean;
  formFields?: FormField[] | unknown;
}

interface MobilePreviewProps {
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
  products?: Product[];
}

export function MobilePreview({ user, socialLinks, products = [] }: MobilePreviewProps) {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return {
          icon: Instagram,
          bg: "bg-gradient-to-tr from-purple-400 to-pink-400",
        };
      case "twitter":
        return { icon: Twitter, bg: "bg-blue-400" };
      case "tiktok":
        return { icon: Music, bg: "bg-black" };
      case "youtube":
        return { icon: Youtube, bg: "bg-red-500" };
      case "linkedin":
        return { icon: Linkedin, bg: "bg-blue-600" };
      case "github":
        return { icon: Github, bg: "bg-gray-800" };
      case "facebook":
        return { icon: Facebook, bg: "bg-blue-600" };
      case "twitch":
        return { icon: Twitch, bg: "bg-purple-600" };
      default:
        return { icon: Link, bg: "bg-gray-400" };
    }
  };

  return (
    <>
      <div className="mx-auto max-w-sm">
        <div className="bg-black rounded-[2.5rem] p-2">
          <div className="bg-white rounded-[2rem] h-[650px] overflow-y-auto scrollbar-hide">
            <div className="p-8 text-center">
              {/* Profile Picture */}
              <div className="mb-4">
                {user.dbUser.avatar ? (
                  <img
                    src={user.dbUser.avatar}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-2xl text-gray-500">
                      {(user.dbUser.fullName || user.dbUser.username)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Display Name */}
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {user.dbUser.fullName || user.dbUser.username}
              </h1>

              {/* Username */}
              <p className="text-gray-600 text-sm mb-4">
                @{user.dbUser.username}
              </p>

              {/* Bio */}
              {user.dbUser.bio && (
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  {user.dbUser.bio}
                </p>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="mb-6 flex justify-center space-x-3">
                  {socialLinks.map((link) => {
                    const { icon: IconComponent, bg } = getSocialIcon(link.platform);
                    return (
                      <div
                        key={link.platform}
                        className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                      >
                        <IconComponent className="text-white w-5 h-5" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Products */}
              {products.filter(product => product.isActive && !product.isDraft).length > 0 && (
                <div className="space-y-3 mb-6">
                  {products
                    .filter(product => product.isActive && !product.isDraft)
                    .map((product) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <div className="flex space-x-3 mb-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
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
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 text-left">
                            {product.title}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 text-left">
                            {product.subtitle || "Describe the value of your free resource here"}
                          </p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-3">
                        {product.type === 'FREE_LEAD' && product.formFields ? (
                          (product.formFields as FormField[]).map((field) => (
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
                          ))
                        ) : (
                          // Default fields for non-lead magnets or products without form fields
                          <>
                            <div>
                              <input
                                type="text"
                                placeholder="Enter your name"
                                disabled
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <input
                                type="email"
                                placeholder="Enter your email"
                                disabled
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700 cursor-not-allowed"
                              />
                            </div>
                          </>
                        )}

                        <button
                          disabled
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                        >
                          {product.buttonText || 'Get Free Download'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
