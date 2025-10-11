"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Target } from "lucide-react";

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
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full bg-primary border-t md:hidden">
      <div className="flex justify-around items-center h-16">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1 text-xs"
            >
              <link.icon
                className={`h-6 w-6 ${
                  isActive ? "text-secondary" : "text-muted-foreground"
                }`}
              />
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
