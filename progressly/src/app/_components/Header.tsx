'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ResilientPwaButton from "./ResilientPwaButton";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/goals", label: "Goals" },
  { href: "/chat", label: "Chat" },
  { href: "/features", label: "Features" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh(); // Ensure the layout re-renders and session state is cleared
  };

  return (
    <header className="border-b border-secondary/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
                      <img
                        src="/images/logo.png"
                        alt="Progressly Logo"
                        width={50}
                        height={32}
                      />        </Link>

        {/* Navigation Links - Hidden on mobile, shown on desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors duration-200 ${
                  isActive
                    ? "text-accent"
                    : "text-textLight hover:text-accent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-x-4">
          <ResilientPwaButton />
          
          {user ? (
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          ) : (
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}