import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  ClerkLoaded,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ResilientPwaButton from "./ResilientPwaButton";

export default function Header() {
  return (
    <header className="border-b border-secondary/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Progressly Logo"
            width={50}
            height={32}
          />
        </Link>

        {/* Navigation Links - Hidden on mobile, shown on desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className="text-textLight hover:text-accent transition-colors duration-200"
          >
            Home
          </Link>
          <Link 
            href="/dashboard" 
            className="text-textLight hover:text-accent transition-colors duration-200"
          >
            Dashboard
          </Link>
          <Link 
            href="/features" 
            className="text-textLight hover:text-accent transition-colors duration-200"
          >
            Features
          </Link>
          <Link 
            href="/contact" 
            className="text-textLight hover:text-accent transition-colors duration-200"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-x-4">
          {/* The PWA button is now a direct child of the main flex container,
              so it will render immediately. */}
          <ResilientPwaButton />
          
          <ClerkLoaded>
            {/* The Sign In/Up and UserButton remain inside ClerkLoaded */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="bg-accent1 text-primary hover:bg-accent1/90">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-accent1 text-primary hover:bg-accent1/90">
                  Sign Up
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  );
}
