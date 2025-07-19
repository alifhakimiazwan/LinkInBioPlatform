"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from './Sidebar';

interface User {
  id: string;
  email?: string;
  dbUser: {
    id: string;
    email: string;
    username: string;
    fullName: string | null;
    avatar: string | null;
    bio: string | null;
  };
}

interface ClientDashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

export function ClientDashboardLayout({ children, user }: ClientDashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Add loading state for route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}