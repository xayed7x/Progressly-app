"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Target, User } from "lucide-react";
import { useUser } from "@supabase/auth-helpers-react";
import Image from "next/image";

const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: Target,
  },
  {
    href: "/chat",
    label: "Chat",
    icon: MessageCircle,
  },
  {
    href: "/account",
    label: "Account",
    icon: User,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const user = useUser();
  
  // Get user's profile picture from Google/Gmail account
  // Google OAuth provides avatar_url, other providers might use picture
  const profilePicture = user?.user_metadata?.avatar_url || 
                        user?.user_metadata?.picture;

  return (
    <nav className="fixed bottom-0 w-full bg-black border-t border-gray-800 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const isAccountLink = link.href === "/account";
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1 text-xs"
            >
              {isAccountLink && profilePicture ? (
                <div className={`relative h-6 w-6 rounded-full overflow-hidden border-2 ${
                  isActive ? "border-secondary" : "border-muted-foreground"
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
                  className={`h-6 w-6 ${
                    isActive ? "text-secondary" : "text-muted-foreground"
                  }`}
                />
              )}
              <span
                className={`${
                  isActive ? "text-secondary" : "text-muted-foreground"
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
