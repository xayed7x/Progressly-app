'use client';

import { Toaster } from "@/components/ui/toaster";
import { PwaUpdater } from "@/components/PwaUpdater";
import BottomNav from "./_components/BottomNav";
import PwaInstallButton from "./_components/PwaInstallButton";

import { usePathname } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <>
      <div className="font-sans bg-primary text-textLight flex flex-col flex-grow">
        <main className="flex-grow overflow-y-auto pb-16 md:pb-0">{children}</main>
        {!isHomePage && <BottomNav />}
      </div>
      <PwaInstallButton />
      <PwaUpdater />
      <Toaster />
    </>
  );
}
