"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  username: string;
}

export function PageHeader({ title, description, username }: PageHeaderProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl = `pintas.store/${username}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-500 text-sm">{description}</p>
          )}
        </div>

        <div className="flex items-center space-x-2 mr-4">
          <button
            onClick={copyToClipboard}
            className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
            title="Copy public URL"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <span className="text-lg font-semibold text-orange-600 hover:text-orange-700 cursor-pointer">
            {publicUrl}
          </span>
        </div>
      </div>
    </div>
  );
}
