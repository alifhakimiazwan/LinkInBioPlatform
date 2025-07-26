import {
  Instagram,
  Twitter,
  Music,
  Youtube,
  Link,
  Linkedin,
  Github,
  Facebook,
  Twitch,
} from "lucide-react";

interface User {
  fullName?: string | null;
  username: string;
  bio?: string | null;
  avatar?: string | null;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface ProfileOverviewProps {
  user: User;
  socialLinks: SocialLink[];
  className?: string;
}

export function ProfileOverview({
  user,
  socialLinks,
  className = "",
}: ProfileOverviewProps) {
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
    <div className={`p-8 fixed top-0 left-0 text-center flex flex-col justify-center h-screen w-full lg:w-1/3 ${className}`}>
      {/* Profile Picture */}
      <div className="mb-6">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto object-cover"
          />
        ) : (
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
            <span className="text-4xl text-gray-500">
              {(user.fullName || user.username).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Display Name */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {user.fullName || user.username}
      </h1>

      {/* Username */}
      <p className="text-gray-600 text-lg mb-6">@{user.username}</p>

      {/* Bio */}
      {user.bio && (
        <p className="text-gray-700 text-base mb-8 leading-relaxed">
          {user.bio}
        </p>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="flex justify-center space-x-4">
          {socialLinks.map((link) => {
            const { icon: IconComponent, bg } = getSocialIcon(link.platform);
            return (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-14 h-14 ${bg} rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
              >
                <IconComponent className="text-white w-7 h-7" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
