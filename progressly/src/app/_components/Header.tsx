import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import InstallPwaButton from "./InstallPwaButton";

export default function Header() {
  return (
    <header className="border-b border-secondary/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Image
          src="/images/logo.png"
          alt="Progressly Logo"
          width={50}
          height={32}
        />

        <div className="flex items-center gap-x-4">
          {/* This part shows only when the user is logged OUT */}
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

          {/* This part shows only when the user is logged IN */}
          <SignedIn>
            <div className="flex items-center gap-x-2">
              <InstallPwaButton />
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
