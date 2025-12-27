'use client';

import { Toaster } from "@/components/ui/toaster";
import { PwaUpdater } from "@/components/PwaUpdater";
import BottomNav from "./_components/BottomNav";
import DesktopSidebar from "./_components/DesktopSidebar";
import PwaInstallButton from "./_components/PwaInstallButton";

import { usePathname } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <>
      <div className="font-sans bg-primary text-textLight flex flex-col flex-grow">
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isHomePage && <DesktopSidebar />}
        
        {/* Main Content - Add left margin on desktop for sidebar */}
        <main className={`flex-grow overflow-y-auto pb-16 md:pb-0 ${!isHomePage ? 'md:ml-64' : ''}`}>
          {children}
        </main>
        
        {/* Mobile Bottom Nav - Hidden on desktop */}
        {!isHomePage && <BottomNav />}
      </div>
      <PwaInstallButton />
      <PwaUpdater />
      <Toaster />
    </>
  );
}
