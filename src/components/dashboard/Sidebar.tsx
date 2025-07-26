"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/dashboard/actions";
import { Home, Store, DollarSign, BarChart3, Users } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  user: {
    dbUser: {
      fullName?: string | null;
      username: string;
      avatar?: string | null;
    };
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "My Store", href: "/dashboard/store", icon: Store },
    { name: "Income", href: "/dashboard/income", icon: DollarSign },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Customer", href: "/dashboard/customers", icon: Users },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 ">
          <Image
            src="/pintas2.svg"
            alt="Pintas"
            width={120}
            height={32}
            className="h-16 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-white border border-orange-400 "
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                style={isActive ? { color: "#db4c2a" } : {}}
              >
                <IconComponent className="mr-3 w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-3">
            {user.dbUser.avatar ? (
              <img
                src={user.dbUser.avatar}
                alt="Profile"
                className="w-8 h-8 rounded-full mr-3"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                <span className="text-sm text-gray-600">
                  {(user.dbUser.fullName || user.dbUser.username)
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.dbUser.fullName || user.dbUser.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                @{user.dbUser.username}
              </p>
            </div>
          </div>
          <form action={signOutAction}>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              type="submit"
            >
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
