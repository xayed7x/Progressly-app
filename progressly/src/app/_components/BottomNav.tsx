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

export default function BottomNav() {
  const pathname = usePathname();
  const user = useUser();
  
  // Get user's profile picture from Google/Gmail account
  const profilePicture = user?.user_metadata?.avatar_url || 
                        user?.user_metadata?.picture;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-gray-800/50 md:hidden z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const isSettingsLink = link.href === "/settings";
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-accent/10" 
                  : "hover:bg-gray-800/50"
              }`}
            >
              {isSettingsLink && profilePicture ? (
                <div className={`relative h-6 w-6 rounded-full overflow-hidden ring-2 transition-all ${
                  isActive ? "ring-accent" : "ring-gray-600"
                }`}>
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <link.icon
                  className={`h-6 w-6 transition-colors ${
                    isActive ? "text-accent" : "text-gray-400"
                  }`}
                />
              )}
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-accent" : "text-gray-400"
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

