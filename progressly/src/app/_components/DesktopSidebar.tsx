"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Settings, BarChart3 } from "lucide-react";
import { useUser } from "@supabase/auth-helpers-react";
import Image from "next/image";

const navLinks = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/chat",
    label: "Chat",
    icon: MessageCircle,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const user = useUser();
  
  // Get user's profile picture from Google/Gmail account
  const profilePicture = user?.user_metadata?.avatar_url || 
                        user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'User';

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-black/95 backdrop-blur-xl border-r border-gray-800/50 flex-col z-40">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-800/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black border border-gray-700 flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="Progressly"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold text-white">Progressly</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-accent/10 text-accent" 
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <link.icon className={`h-5 w-5 ${isActive ? "text-accent" : ""}`} />
                <span className="font-medium">{link.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-800/50">
        <Link 
          href="/settings"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
        >
          {profilePicture ? (
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-gray-700">
              <Image
                src={profilePicture}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
